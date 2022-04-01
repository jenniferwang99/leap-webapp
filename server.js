
const express = require('express')
const ImageKit = require("imagekit");
const fs = require('fs')
const app = express();

var imagekit = new ImageKit({
  publicKey: "public_HDWMj/1g2MZbnJ1y4VDMcmou9Xg=",
  privateKey: "private_g24W1XYxY/VLXR6BDVa32KNssno=",
  urlEndpoint: "https://ik.imagekit.io/jennwang"
});

app.get('/signature', (req, res) => {
  var authentcationParameters = imagekit.getAuthenticationParameters();
  res.send(authentcationParameters);
})

app.get('/', (req, res) => {
  res.writeHead(200, { 'content-type': 'text/html' });
  fs.createReadStream('index.html').pipe(res);
});

app.listen(3000, () => {
  console.log("Sample backend app listening at http://localhost:3000");
})