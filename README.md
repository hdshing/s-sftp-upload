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
    host: 'xx.xx.xx.xx',  // 必填，ftp服务器地址
    port: xx,  // 必填，ftp服务器端口，例：22 （一般默认是22）
    username: 'xxxx',  // 必填，ftp服务器用户名
    password: 'xxxxxx',  // 必填，ftp服务器密码
    localPath: path.resolve(__dirname, 'xxx'),  // 必填，指定本地上传目录，例：./dist
    remotePath: 'xxx',  // 必填，指定远程服务器上传目录，例：/app/bus/admin
})
// 开始执行上传
ftpU.start()
```



## 参数配置

| Option     | Value  | Description                                                  |
| ---------- | ------ | ------------------------------------------------------------ |
| host       | String | 必填，服务器主机地址，例：’x.x.x.x'                          |
| port       | Number | 必填，端口，例：22 （一般默认22）                            |
| username   | String | 必填，服务器用户名，例：root                                 |
| password   | String | 必填，服务器用户密码，例：123456                             |
| localPath  | String | 必填，指定本地需上传的目录，*需要绝对路径<br />例：path.resolve(__dirname, './xxx') |
| remotePath | String | 必填，指定上传到远程服务器的目录，*需确保目录存在<br />例：'/app/bus/admin' |

