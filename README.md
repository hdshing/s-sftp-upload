<p align="center">
  <a href="#安装">
    <img alt="s-sftp-upload logo" src="https://img.xwyue.com/i/2024/09/30/66fa59c2cb6f9.png" width="200">
  </a>
  <br/>
</p>


# s-sftp-upload

一个简单的ftp上传工具包，创建目的主要是用于项目打包部署代码。
将指定本地目录上传到远程服务器指定目录中。
还可将本地上传目录文件打包备份到服务器上，保存每次部署的代码版本。



## 安装

```javascript
npm install s-sftp-upload
```



## 简单示例

``` javascript
const path = require('path');
const ftpUpload = require('s-sftp-upload');

const ftpU = new ftpUpload({
    host: 'xx.xx.xx.xx',
    port: 22,
    username: 'root',
    password: '123456',
    localPath: path.resolve(__dirname, './dist'), // 指定需上传的本地目录
    remotePath: '/app/bus/admin', //指定服务器目录
    // 以下可选填
    isBackup: true,
    backupPath: '/app/bus/admin/backup',
})
// 开始执行上传
ftpU.start()
```



## 参数配置

|   Option   |  Value  | Description                                                  |
| :--------: | :-----: | ------------------------------------------------------------ |
|    host    | String  | 必填，服务器主机地址，例：’x.x.x.x'                          |
|    port    | Number  | 必填，端口，例：22 （一般默认22）                            |
|  username  | String  | 必填，服务器用户名，例：root                                 |
|  password  | String  | 必填，服务器用户密码，例：123456                             |
| localPath  | String  | 必填，指定本地需上传的目录，需要绝对路径，例：path.resolve(__dirname, './xxx') |
| remotePath | String  | 必填，指定上传到远程服务器的目录，例：'/app/bus/admin'       |
|  isBackup  | Boolean | 可选，是否需要需要打包上传备份                               |
| backupPath | String  | 可选，当isBackup=true时，可指定打包压缩后的文件上传远程服务器路径，默认为 remotePath 路径。 |

