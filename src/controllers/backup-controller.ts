import * as fs from 'fs-extra';
import * as path from 'path';
import * as request from 'request'

export class BackupController {

    root = './archivos'
    backup = './backup/'
    recovery = '/recovery/'
  
    backupDecide(name: string, ip_from: string, port_from: string, ip_to: string = "", port_to: string = "", data: string = "", operacion: string = 'backup') {
        if (ip_to === "" && port_to === "") {
        return this.backupLocal(ip_from, port_from, name, operacion);
        } else if (ip_to !== "" && port_to !== "") {
        return this.backupCloud(ip_from, port_from, ip_to, port_to, name, data, operacion);
        } else {
        return {"status": false, "message": 'Error se desconoce donde necesita realizar el backup'};
        }
    }

    backupLocal(ip_from: string, port_from: string, name: string, operacion: string) {
        try {
            if (operacion === 'backup') {
                fs.copySync(this.root, `./backup/${name}`);
                return {"status": true, "message": `${operacion} en ${ip_from}:${port_from} creado exitosamente`};
            } else {
                if (fs.existsSync(this.backup+name)) {
                    fs.copySync(this.backup + name, this.root + this.recovery + name);
                    return {"status": true, "message": `${operacion} en ${ip_from}:${port_from} creado exitosamente`};    
                } else {
                    return {"status": false, "message": `El ${operacion} en ${ip_from}:${port_from} no existe`};
                }
            }
        } catch (e) {
            return {"status": false, "message": `Error al crear ${operacion} en ${ip_from}:${port_from}. Razón: ${e}`};
        }
    }

    backupCloud(ip_from: string, port_from: string, ip_to: string, port_to: string, name: string, _data: string, operacion: string) {
        if (_data === "") {
            let ruta = this.root;
            if (operacion === 'recovery'){
                ruta = this.backup + name;
            }

            if (fs.existsSync(ruta)){
                const resT = this.listadoJsonServer(ruta);
                const json = {
                    ip_from: ip_from, port_from: port_from, ip_to: ip_to, port_to: port_to,
                    name: name, data: JSON.parse(`{${resT}}`), operacion}
                const solicitud = {
                    url: `http://${ip_to}:${port_to}/backup`,
                    method: "POST",
                    json: true,
                    body: json
                }
                console.log('data: ', json);
                request.post(solicitud, (err: any, res: any, body: any) =>{
                    if (err) { 
                        return {"status": false, "message": `Error al conectarse con ${ip_to}:${port_to}. Razón: ${err}`};
                    }
                });
                return {"status": true, "message": `${operacion} ${name} realizado en ${ip_to}:${port_to}`};
            } else {
                return {"status": false, "message": `El ${operacion} en ${ip_from}:${port_from} no existe`}
            }
        } else {
            try {
                let ruta = this.backup+name
                if (operacion == 'recovery') {
                    ruta = this.root + this.recovery
                }
                this.recorrerJsonServer(ruta, _data)
                return {"status": true, "message": `${operacion} en ${ip_to}:${port_to} creado exitosamente`};
            } catch (e) {
                return {"status": false, "message": `Error al realizar ${operacion} en ${ip_to}:${port_to}. Razón: {e}`};
            }
        }
        
    }

    listadoJsonServer(url: string) {
        const listado = fs.readdirSync(url);
        let txtJson = '';
        for (let i = 0; i < listado.length; i++) {
        const item = listado[i];
        const itemPath = path.join(url, item);
        if (fs.statSync(itemPath).isFile()) {
            if (item.endsWith('.txt')) {
            if (i < listado.length - 1) {
                txtJson += `"${item}":"${this.readTxt(itemPath)}",`;
            } else {
                txtJson += `"${item}":"${this.readTxt(itemPath)}"`;
                return txtJson;
            }
            }
        } else {
            if (i < listado.length - 1) {
            txtJson += `"${item}":{${this.listadoJsonServer(itemPath)}},`;
            } else {
            txtJson += `"${item}":{${this.listadoJsonServer(itemPath)}}`;
            return txtJson;
            }
        }
        }
        return '';
    }

    readTxt(path: string) {
        try {
        const contenido = fs.readFileSync(path, 'utf-8');
        console.log('contenido: ', contenido)
        return contenido;
        } catch (e) {
            console.log('error', e);
        return '';
        }
    }

    recorrerJsonServer(ruta: string, aJson: any): void {
        for (const aA in aJson) {
          console.log('elemento: ' + aA);
          if (aA.includes('.txt')) {
            this.screateSever(aA, aJson[aA], ruta + '/');
          } else {
            fs.mkdirSync(path.join(ruta, aA), { recursive: true });
            this.recorrerJsonServer(path.join(ruta, aA), aJson[aA]);
          }
        }
      }
      
    screateSever(nombre: string, contenido: string | null, path: string): void {
        fs.writeFileSync(path + nombre, contenido || '');
    }
}