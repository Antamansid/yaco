const express = require('express');
const path = require('path');
const init = require('init-package-json');
const fs = require('fs');
const bodyParser = require('body-parser');
const exec = require('executive');
const execС = require('child_process').exec;

const app = express();
app.use(express.static(path.resolve(__dirname)));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.post('/newProject', function(req, res){
  //Создаем директорию проекта
  fs.mkdir(req.body.name, ()=>{
    //Создаем директорию модулей в проекте
    fs.mkdir(path.resolve(__dirname, req.body.name, 'node_modules'), ()=>{
      res.end();
    });
  });
});

app.post('/addDependency', function(req, res){
  fs.access(path.resolve(req.body.nameProject, 'index.js'),(error)=>{
    if(error){
      fs.writeFile(path.resolve(req.body.nameProject, 'index.js'), `let ${req.body.variableDependency} = require('${req.body.nameDependency}'); module.exports = ${req.body.variableDependency}`, 
      ()=>{npmIDependency(req.body.nameDependency, path.resolve(req.body.nameProject), ()=>{
        browserifyThat(path.resolve(req.body.nameProject), req.body.nameDependency, (data)=>{
          res.json(data);
        });
      })}
      );
    } else {
      fs.writeFile(path.resolve(req.body.nameProject, 'index.js'), `require('${req.body.nameDependency}')`, 
      ()=>{npmIDependency(req.body.nameDependency, path.resolve(req.body.nameProject), ()=>{
        browserifyThat(path.resolve(req.body.nameProject), req.body.nameDependency, (data)=>{
          res.json(data);
        });
      })}
      );
    }
  })
});

function npmIDependency(dependency, dirrectory, callback){
  exec(`npm i --prefix ${dirrectory} ${dependency} --save`, (err, stdout, stderr)=>{
    callback();
  })
}
function browserifyThat(dirrectory, module, callback){
  //exec не работает, пришлось через процесс чайлд. Браузерсерфи тоже гавнюки -r не дает указать дирректорию
  function execute(command, callback){
    execС(command, function(error, stdout, stderr){ callback(error); });
  };
  let j = `cd ${path.resolve(dirrectory)} && browserify -r ${module} -o ${path.resolve(dirrectory, 'bundl.js')}`;
  execute(j, (std)=>{
    fs.readFile(path.resolve(dirrectory, 'bundl.js'), 'utf8', (err, data)=>{
      callback(data);
    })
  });
}


app.listen(80);