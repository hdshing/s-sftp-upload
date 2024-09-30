const path = require('path');
const fs = require('fs');
const SFTPClient = require('ssh2-sftp-client');
const ProgressBar = require('progress'); // 进度条插件
const fg = require('fast-glob');

class ftpUpload {
    constructor(config) {
        let { localPath, remotePath, privateKeyPath, isBackup=false, backupPath="", ...ftpConfig } = config
        this.ftpConfig = ftpConfig
        this.localDirPath = localPath;
        this.remoteDirPath = remotePath; // '/app/bus/admin'
        this.sftp = null;
        this.bar = null;
        this.backupPath = backupPath || remotePath // 打包备份存放的路径
        this.isBackup = isBackup
        if (privateKeyPath) {
            this.ftpConfig.privateKey = fs.readFileSync(privateKeyPath)
        }
        const rules = {
            host: true,
            port: true,
            username: true,
            password: !privateKeyPath,
            privateKeyPath: !ftpConfig?.password,
            localPath: true,
            remotePath: true,
        }
        for (let key in rules) {
            if(rules[key] && !config[key] ){
                throw new Error(`'${key}' is required.`);
            }
        }
    }
    async start() {
        this.sftp = new SFTPClient();
        this.sftp.connect(this.ftpConfig).then(async () => {
            this.bar = await this.initPropress()
            // console.log('Start Uploading...');
            return this.uploadDirectory(this.localDirPath, this.remoteDirPath);
        }).then(async () => {
            if(this.isBackup === true){
                // await this.compressedUpload(this.localDirPath, `${this.remoteDirPath}${this.backupPath}`)
                await this.compressedUpload(this.localDirPath, this.backupPath)
            }
            let t='上传完毕!!!😀'
            process.stdout.isTTY ? console.log('\x1b[32m' + t + '\x1b[0m') : console.log(t)
            this.sftp.end();
        }).catch(err => {
            console.error('Upload Error ', err);
            this.sftp.end();
        });
    }
    async initPropress() {
        // 检查文件数量
        function countFilesInDirectory(path) {
            return new Promise(async (resolve, reject) => {
                try {
                    const allfs = await fg([`${path}/**/*`], { onlyFiles: true });
                    resolve(allfs)
                } catch (err) {
                    console.error('Error while counting files:', err);
                }
            })
        }
        return new Promise(async (resolve, reject) => {
            const fgFiles = await countFilesInDirectory(this.localDirPath.replace(/\\/g, '/'))
            // console.log('fgFiles ',fgFiles)
            const b = new ProgressBar('上传中 [:bar] :percent, 总文件数 = :total, 预计剩余时间 = :etas ', {
                total: fgFiles.length,
                width: 40,  // 进度条的宽度
                complete: '=',  // 完成部分的符号
                incomplete: '·',  // 未完成部分的符号
                renderThrottle: 200  // 更新进度条的最小间隔时间，防止过于频繁的刷新
            });
            resolve(b)
        })
    }
    // 处理文件上传
    async handleUpload(localFilePath, remoteFilePath) {
        return this.sftp.put(localFilePath, remoteFilePath)
            .then(() => {
                // console.log(localFilePath + ' => ' + remoteFilePath + ' --- 上传成功😀');
                this.bar.tick();
                return true;
            })
            .catch(err => {
                console.log(localFilePath + ' --- Upload Error！！！❌😟', err);
                throw err;
            });
    }
    // 上传指定本地文件夹内容
    async uploadDirectory(localDir, remoteDir) {
        await this.checkCreateDir(remoteDir);
        const files = fs.readdirSync(localDir);
        for (const file of files) {
            const localFilePath = path.join(localDir, file);
            const remoteFilePath = `${remoteDir}/${file}`;
            const stats = fs.lstatSync(localFilePath);
            // 判断是否为目录
            if (stats.isDirectory()) {
                // 检查远程路径是否存在
                const exists = await this.sftp.exists(remoteFilePath);
                if (exists === 'd') {
                    // 如果远程路径已是目录，递归上传
                    await this.uploadDirectory(localFilePath, remoteFilePath);
                } else if (!exists) {
                    // 如果远程路径不存在，创建目录并递归上传
                    await this.sftp.mkdir(remoteFilePath, true);
                    await this.uploadDirectory(localFilePath, remoteFilePath);
                } else {
                    // 如果是文件，处理冲突
                    console.error(`\n远程路径 ${remoteFilePath} 已存在并且是文件，无法创建目录。`);
                }
            } else {
                // 如果是文件，直接上传
                await this.handleUpload(localFilePath, remoteFilePath);
            }
        }
    };
    // 压缩文件上传
    async compressedUpload(dirPath, remoteDir) {
        const archiver = require('archiver');
        return new Promise(async (resolve, reject) => {
            const zipFileName = `${this.getCurrentTime()}.zip` // 压缩包文件名
            const tempZipFilePath = path.resolve(__dirname, zipFileName) // 临时本地压缩包
            const remoteOutputFilePath = `${remoteDir}/${zipFileName}` // * 远程输出文件路径需要反斜杆‘/’ *
            await this.checkCreateDir(remoteDir);
            // 创建输出流
            const output = fs.createWriteStream(tempZipFilePath);
            const archive = archiver('zip', { zlib: { level: 9 } });  // 压缩级别 9
            // 监听输出流关闭事件，确保输出流关闭
            output.on('close', async () => {
                // console.log(`打包完成，文件大小：${archive.pointer()}`);
                await this.handleUpload(tempZipFilePath, remoteOutputFilePath)
                try {
                    // console.log('删除临时文件')
                    fs.unlinkSync(tempZipFilePath);
                } catch (err) {
                    console.log(err)
                }
                resolve()
            })
            archive.on('error', (err) => {
                reject()
                throw err;
            })
            // 将压缩内容打包到输出流中
            archive.pipe(output);
            // 将目录添加到压缩包中
            archive.directory(dirPath, false);
            // 完成打包
            archive.finalize();
        })
    }
    // 检查远程路径是否存在，不存在则创建
    checkCreateDir(dirPath) {
        return new Promise(async (resolve, reject) => {
            const exists = await this.sftp.exists(dirPath);
            if (!exists) {
                // console.log(`远程 ${dirPath} 不存在，创建中...`)
                await this.sftp.mkdir(dirPath, true);
            }
            resolve()
        })
    }
    // 获取当前时间 ----- 工具函数
    getCurrentTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 月份是从0开始的
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hours}-${minutes}-${seconds}`;
    }
}

module.exports = ftpUpload;