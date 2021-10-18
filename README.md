# yosei

基于的daemon启动器: kyrie
- 根据命令行参数或环境变量决定启动多少worker.
- 根据模块导出来组织行为.
- 具有一个HTTP API接口, 可以调节worker数量, 关闭daemon, 重启daemon, 查看日志.
- 崩溃后恢复.

## 与cluster的区别
daemon-threads不是以部署交互式服务为目的建立的(例如HTTP服务器),
如果需要服务, 则应该使用Node.js内建的cluster模块或pm2.
