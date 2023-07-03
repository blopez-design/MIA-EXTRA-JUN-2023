import * as fs from 'fs-extra';
import * as path from 'path';
import * as request from 'request'

export class BackupController {

    root = './archivos'
    backup = './backup/'
  
    backupDecide(name: string, ip_from: string, port_from: string, ip_to: string = "", port_to: string = "", data: string = "") {
        if (ip_to === "" && port_to === "") {
        return this.backupLocal(ip_from, port_from, name);
        } else if (ip_to !== "" && port_to !== "") {
        return this.backupCloud(ip_from, port_from, ip_to, port_to, name, data);
        } else {
        return {"status": false, "message": 'Error se desconoce donde necesita realizar el backup'};
        }
    }

    backupLocal(ip_from: string, port_from: string, name: string) {
        try {
            fs.copySync(this.root, `./backup/${name}`);
            return {"status": true, "message": `Backup en ${ip_from}:${port_from} creado exitosamente`};
        } catch (e) {
            return {"status": false, "message": `Error al crear backup en ${ip_from}:${port_from}. Razón: ${e}`};
        }
    }

    backupCloud(ip_from: string, port_from: string, ip_to: string, port_to: string, name: string, _data: string) {
        if (_data === "") {
            const resT = this.listadoJsonServer(this.root);
            const json = {
                ip_from: ip_from, port_from: port_from, ip_to: ip_to, port_to: port_to,
                name: name, data: JSON.parse(`{${resT}}`)}
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
            return {"status": true, "message": `Backup ${name} realizado en ${ip_to}:${port_to}`};
        } else {
            try {
                this.recorrerJsonServer(this.backup+name, _data)
                return {"status": true, "message": `Backup en ${ip_to}:${port_to} creado exitosamente`};
            } catch (e) {
                return {"status": false, "message": `Error al crear backup en ${ip_to}:${port_to}. Razón: {e}`};
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