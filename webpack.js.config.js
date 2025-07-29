const path = require('path');
const fs = require('fs');

// Função para gerar entradas dinâmicas com base nos arquivos em uma pasta
function generateEntries(sourceDir, extension) {
    const entries = {};
    if (fs.existsSync(sourceDir)) {
        const files = fs.readdirSync(sourceDir);
        files.forEach(file => {
            if (file.endsWith(extension)) {
                const name = path.basename(file, extension); // Nome base do arquivo
                entries[`${sourceDir}/${name}`] = path.join(sourceDir, file);
            }
        });
    }
    return entries;
}

// Diretórios de entrada
const publicJsSourceDir = path.resolve(__dirname, 'Public/js');
const adminJsSourceDir = path.resolve(__dirname, 'Admin/js');

// Configuração do Webpack para JavaScript
module.exports = {
    mode: 'production', // Modo de produção para compactação
    entry: {
        ...generateEntries(publicJsSourceDir, '.js'),
        ...generateEntries(adminJsSourceDir, '.js'),
    },
    output: {
        path: path.resolve(__dirname), // Diretório base para saída
        filename: '[name].COMPILED.js', // Nome do arquivo de saída para JS
    },
    module: {
        rules: [
            {
                test: /\.js$/, // Aplica a regra para arquivos .js
                exclude: /node_modules/, // Ignora a pasta node_modules
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'], // Transpila para ES5
                    },
                },
            },
        ],
    },
};