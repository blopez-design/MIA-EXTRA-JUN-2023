import express from 'express';
import fs from 'fs';
import path from 'path';
import { BackupController } from './controllers/backup-controller';

const root = './archivos'
const port = 3000;
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.post('/create', (req, res) => {
  let { _path, name, body, ip, port } = req.body;
  let address = 'http://'+ip + ':'+ port
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
          res.status(200).send({status: false, message: `La carpeta ${_path.replace('archivos', '')} ya existe en ${address}.`});          
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
    res.status(200).send({status: true, message: `El objeto ${_path.replace('archivos', '')} ha sido creado en ${address}.`});      
  }catch(e: any) {
    res.status(200).send({status: false, message: `Error al crear objeto ${_path.replace('archivos', '')}. Razón: ${e.message}}`});    
  }
});

app.post('/delete_all', (req, res) => {
  let { ip, port } = req.body;
  let address = 'http://'+ip + ':'+ port
  try {
    fs.rmdirSync(root, { recursive: true });
    fs.mkdirSync(root);
    res.send({status: true, message:`El servidor ${address} esta vacío.`});
  } catch (error) {
    res.status(200).send({status: false, message:`Error al eliminar archivos del servidor ${address}. Razón: ${error}`});
  }
});

app.post('/backup', (req, res) => {
  let { name, ip_from, port_from, ip_to, port_to, data, operacion } = req.body;
  const backup = new BackupController();
  console.log('save data: ', {name, ip_from, port_from, ip_to, port_to, data, operacion});
  const respuesta = backup.backupDecide(name, ip_from, port_from, ip_to, port_to, data, operacion);
  res.status(200).send(respuesta); 
});

app.listen(port,'0.0.0.0', ()=> console.log('Start server on PORT ' + port));