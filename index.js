const express = require('express');
const fs = require('fs');
const util = require('util');
const mime = require('mime');
const multer = require('multer');
const upload = multer({dest: 'uploads/'});
// 파일 버퍼로 받고싶다면
// const upload = multer({ 'storage': multer.memoryStorage() })

/*------------------------------------*/
/* [ google api 연동 ] */
const gcloud = require('google-cloud')({
  keyFilename: 'gkey.json',
  projectId: 'my-project-1234567890987'
});
const vision = gcloud.vision();

const app = express();

app.use(express.static(__dirname + '/public'));
app.get('/', (req, res) => {
  res.sendfile('./public/index.html');
});

app.post('/upload', upload.single('image'), (req, res) => {
  // faces, landmarks, labels, logos, properties, safeSearch, texts
  let types = ['labels'];

  console.log(req.file.path, '<< [ req.file.path ]');

  vision.detect(req.file.path, types, (err, detections, apiResponse) => {
    if(err){
      res.end(err);
    }else{
      const apiData = [];
      apiResponse.responses[0].labelAnnotations.map(val => {
        apiData.push({
          description: val.description,
          score: val.score
        })
      });  

      res.writeHead(200, {
        'Content-Type': 'text/html'
      });
      res.write('<html><meta charset="UTF-8"><body>');
      res.write('<img max-width: 100%; src="' + base64Image(req.file.path) + '"><br>');
      res.write(JSON.stringify(apiData));
      //opt????
      fs.unlinkSync(req.file.path);

      res.end('</body></html>');
    }
  });
});

app.listen(3000, () => {
  console.log('[ listening... ]');
});

function base64Image(src){
  let data = fs.readFileSync(src).toString('base64');
  return util.format('data:%s;base64,%s', mime.lookup(src), data);
}