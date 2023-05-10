const http = require('http');
const fs = require('fs');

http.get('http://127.0.0.1:4040/api/tunnels', res => {
    let data = [];

    res.on('data', chunk => {
        data.push(chunk);
    });

    return res.on('end', () => {
        //console.log('Response ended: ');
        const result = JSON.parse(Buffer.concat(data).toString());

        for (tunnel of result.tunnels) {
            //console.log(`Got response: ${tunnel.name}`);
            if (tunnel.name === 'backend') {
                // Output To A File In public
                fs.writeFileSync('public/server.json', JSON.stringify({
                    'server': tunnel.public_url
                }));
                break;
            }
        }    
      });
    }).on('error', err => {
        //console.log('Error: ', err.message);
        fs.writeFileSync('public/server.json', JSON.stringify({
            'server': 'http://localhost:8080'
        }));
    });

return 0;