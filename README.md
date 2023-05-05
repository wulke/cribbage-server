# cribbage-server

#### Running Locally
`git clone https://github.com/wulke/cribbage-server.git`

`npm run start`

#### Connecting to server / PM2 

`ssh {user}@{droplet ip}`

`pm2 list`

`cd /cribbage-server`

`pm2 start server.js --name cribbage-server`

`pm2 monit`

`pm2 stop cribbage-server`

`pm2 delete cribbage-server`

#### References
[github cli](https://cli.github.com/manual)
[socket.io](https://socket.io/docs/v4/)
[socket.io emit cheatsheet](https://socket.io/docs/v4/emit-cheatsheet/)
[pm2](https://github.com/Unitech/pm2)
[example](https://github.com/llyram/Declare)
[deploying to DigitalOcean](https://coderrocketfuel.com/article/create-and-deploy-an-express-rest-api-to-a-digitalocean-server)
[deploy & build in DigitalOcean](https://medium.com/@chathula/how-to-set-up-a-ci-cd-pipeline-for-a-node-js-app-with-github-actions-2073201b0df6)
[jsdoc](https://www.prisma.io/blog/type-safe-js-with-jsdoc-typeSaf3js)
[vitest](https://vitest.dev/guide/)