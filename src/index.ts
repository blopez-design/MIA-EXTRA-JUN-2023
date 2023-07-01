import express from 'express';
import fs from 'fs';
import path from 'path';
import ip from 'ip';

const root = './archivos'
const port = 3000;
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.listen(port, '0.0.0.0');

app.post('/create', (req, res) => {
  let { _path, name, body } = req.body;
  _path = 'archivos' + _path + name;
  console.log('path', _path);
  try {
    const nombreArchivo = path.basename(_path);
    console.log('basename: ', nombreArchivo);
    const extension = path.extname(nombreArchivo);
    console.log('extension: ', extension);
    const rutaArchivo = !!extension ? path.dirname(_path): _path;
    console.log('dirname: ', rutaArchivo);
    
    if (!fs.existsSync(rutaArchivo)) {
      fs.mkdirSync(rutaArchivo, { recursive: true });
    } else {
      if(!extension) {
          res.status(200).send({status: false, message: `La carpeta ${_path.replace('archivos', '')} ya existe en ${ip.address()}.`});          
        return;
      }
    }

    if(!!extension) {
      let contador = 0;
      let archivoCompleto = path.join(rutaArchivo, nombreArchivo);
      while (fs.existsSync(archivoCompleto)) {
        contador++;
        const extension = path.extname(nombreArchivo);
        const nombreBase = path.basename(nombreArchivo, extension);
        archivoCompleto = path.join(rutaArchivo, `${nombreBase}_${contador}${extension}`);
      }
      fs.writeFileSync(archivoCompleto, body);    
    }
    res.status(200).send({status: true, message: `El objecto ${_path.replace('archivos', '')} ha sido creado en ${ip.address()}.`});      
  }catch(e: any) {
    res.status(200).send({status: false, message: `Error al crear objecto ${_path.replace('archivos', '')}. Razón: ${e.message}}`});    
  }
});


app.post('/delete_all', (req, res) => {
  try {
    fs.rmdirSync(root, { recursive: true });
    res.send({status: true, message:`El servidor ${ip.address()} esta vacío.`});
  } catch (error) {
    res.status(500).send({status: false, message:`Error al eliminar archivos del servidor ${ip.address}. Razón: ${error}`});
  }
});

app.listen(port, ()=> console.log('Start server on PORT ' + port));