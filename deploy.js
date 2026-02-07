const { exec } = require('child_process');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
    host: '155.94.160.248',
    username: 'root',
    password: '59t5U3rv1TSNnf5mCO',
    localPath: 'G:\\logvpn-build\\deploy-package',
    remotePath: '/opt/logvpn-deploy'
};

async function deploy() {
    console.log('=== LogVPN Deployment ===');
    
    const conn = new Client();
    
    conn.on('ready', () => {
        console.log('SSH connected!');
        
        // Create directory
        conn.exec(`mkdir -p ${config.remotePath}`, (err, stream) => {
            if (err) throw err;
            stream.on('close', () => {
                console.log('Directory created');
                uploadFiles();
            });
        });
    });
    
    async function uploadFiles() {
        const items = fs.readdirSync(config.localPath);
        
        for (const item of items) {
            const localItem = path.join(config.localPath, item);
            const remoteItem = `${config.remotePath}/${item}`;
            
            const stats = fs.statSync(localItem);
            if (stats.isDirectory()) {
                console.log(`Uploading directory: ${item}...`);
                await uploadDirectory(localItem, remoteItem);
            } else {
                console.log(`Uploading file: ${item}...`);
                await uploadFile(localItem, remoteItem);
            }
            console.log(`Uploaded: ${item}`);
        }
        
        runDeployment();
    }
    
    function uploadDirectory(localDir, remoteDir) {
        return new Promise((resolve, reject) => {
            conn.exec(`mkdir -p ${remoteDir}`, (err) => {
                if (err) return reject(err);
                
                const files = fs.readdirSync(localDir);
                let count = 0;
                
                files.forEach(file => {
                    const localFile = path.join(localDir, file);
                    const remoteFile = `${remoteDir}/${file}`;
                    
                    if (fs.statSync(localFile).isDirectory()) {
                        uploadDirectory(localFile, remoteFile).then(() => {
                            count++;
                            if (count === files.length) resolve();
                        });
                    } else {
                        conn.sftp((err, sftp) => {
                            if (err) return reject(err);
                            sftp.fastPut(localFile, remoteFile, (err) => {
                                if (err) return reject(err);
                                count++;
                                if (count === files.length) resolve();
                            });
                        });
                    }
                });
                
                if (files.length === 0) resolve();
            });
        });
    }
    
    function uploadFile(localFile, remoteFile) {
        return new Promise((resolve, reject) => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(localFile, remoteFile, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });
    }
    
    function runDeployment() {
        console.log('\nRunning deployment script...');
        conn.exec(`chmod +x ${config.remotePath}/deploy.sh && cd ${config.remotePath} && bash deploy.sh`, (err, stream) => {
            if (err) throw err;
            
            let output = '';
            stream.on('data', (data) => {
                output += data;
                process.stdout.write(data);
            });
            
            stream.on('close', () => {
                console.log('\n=== Deployment completed ===');
                testEndpoints();
            });
        });
    }
    
    function testEndpoints() {
        console.log('\n=== Testing endpoints ===');
        
        conn.exec('curl -s -o /dev/null -w "%{http_code}" http://localhost', (err, stream) => {
            let data = '';
            stream.on('data', (chunk) => data += chunk);
            stream.on('close', () => {
                console.log(`Main site (http://localhost): HTTP ${data}`);
                
                conn.exec('curl -s http://localhost:3000/health', (err, stream2) => {
                    let healthData = '';
                    stream2.on('data', (chunk) => healthData += chunk);
                    stream2.on('close', () => {
                        console.log(`Health check (http://localhost:3000/health): ${healthData}`);
                        conn.end();
                        process.exit(0);
                    });
                });
            });
        });
    }
    
    conn.connect(config);
}

deploy().catch(err => {
    console.error('Deployment failed:', err);
    process.exit(1);
});
