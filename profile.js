// NPM modules
var crypto = require('crypto');
var home = require('os').homedir();
var express = require('express');
var app = express();
var fs = require('fs');
var fsw = require('fs').promises;
var path = require('path');
var JSZip = require('jszip');

// Default vars
var error = {status: 'error'};
app.use(express.json({ limit: '500MB' }));

// Catch all to detect endpoint
app.get('/*', function(req, res) {
  res.send('pong');
});

// Catch all for any post
app.post('/*', async function(req, res) {
  try {
    let type = req.body.type;
    // Send default profile unauthenticated
    if (type == 'default') {
      try {
        let profilePath = home + '/profile/default/';
        let zip = new JSZip();
        let items = await fs.readdirSync(profilePath);
        async function addToZip(item) {
          if (fs.lstatSync(item).isDirectory()) {
            let items = await fs.readdirSync(item);
            if (items.length > 0) {
              for await (let subPath of items) {
                await addToZip(item + '/' + subPath);
              }
            }
          } else {
            let data = fs.readFileSync(item);
            let zipPath = item.replace(profilePath,'');
            zip.file(zipPath, data);
          }
          return;
        }
        for await (let item of items) {
          await addToZip(profilePath + item);
        }
        zip.generateAsync({type:"base64"}).then(function callback(base64) {
          res.json({status: 'success',data: base64});
        });
      } catch (e) {
        console.log(e);
        res.json(error);
      }
    } else {
      let auth = req.body.user + req.body.pass;
      // Simple hash auth
      let hash = crypto.createHash('sha256').update(auth).digest('hex');
      let profileJson = await fsw.readFile(home + '/profile/profile.json', 'utf8');
      let profile = JSON.parse(profileJson);
      if (profile.hasOwnProperty(hash)) {
        // Return username if found
        if (type == 'login') {
          res.json({status: 'success', user: profile[hash].username});
        // Take client data and write it to profile
        } else if (type == 'push') {
          let profilePath = home + '/profile/' + profile[hash].username + '/';
          let baseData = req.body.data;
          // Purge current storage
          let items = await fsw.readdir(profilePath);
          if (items.length > 0) {
            for await (let item of items) {
              var filePath = profilePath + item;
              if (fs.statSync(filePath).isFile()) {
                await fsw.rm(filePath);
              } else {
                await fsw.rm(filePath, { recursive: true, force: true });
              }
            }
          }
          // Load zip from data
          let zip = new JSZip();
          zip.loadAsync(baseData, {base64: true}).then(async function(contents) {
            // Unzip the files to the FS by name
            for await (let fileName of Object.keys(contents.files)) {
              if (fileName.endsWith('/')) {
                if (! fs.existsSync(profilePath + fileName)) {
                  await fsw.mkdir(profilePath + fileName);
                }
              }
            }
            for await (let fileName of Object.keys(contents.files)) {
              if (! fileName.endsWith('/')) {
                zip.file(fileName).async('arraybuffer').then(async function(content) {
                  await fsw.writeFile(profilePath + fileName, Buffer.from(content));
                });
              }
            }
          });
          res.json({status: 'success',user: profile[hash].username});
        // Send client data to write to indexedDB
        } else if (type == 'pull') {
          try {
            let profilePath = home + '/profile/' + profile[hash].username + '/';
            let zip = new JSZip();
            let items = await fs.readdirSync(profilePath);
            async function addToZip(item) {
              if (fs.lstatSync(item).isDirectory()) {
                let items = await fs.readdirSync(item);
                if (items.length > 0) {
                  for await (let subPath of items) {
                    await addToZip(item + '/' + subPath);
                  }
                }
              } else {
                let data = fs.readFileSync(item);
                let zipPath = item.replace(profilePath,'');
                zip.file(zipPath, data);
              }
              return;
            }
            for await (let item of items) {
              await addToZip(profilePath + item);
            }
            zip.generateAsync({type:"base64"}).then(function callback(base64) {
              res.json({status: 'success',data: base64});
            });
          } catch (e) {
            console.log(e);
            res.json(error);
          }
        } else {
          res.json(error);
        }
      } else {
        res.json(error);
      }
    }
  } catch (e) {
    console.log(e)
    res.json(error);
  }
});

app.listen(3001);
