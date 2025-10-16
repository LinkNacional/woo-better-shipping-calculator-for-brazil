const path = require('path');
const fs = require('fs');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

// Função para gerar entradas dinâmicas com base nos arquivos em uma pasta
function generateEntries(sourceDir, extension) {
    const entries = {};
    if (fs.existsSync(sourceDir)) {
        const files = fs.readdirSync(sourceDir);
        files.forEach(file => {
            if (file.endsWith(extension)) {
                const name = path.basename(file, extension); // Nome base do arquivo
                entries[name] = path.join(sourceDir, file); // Caminho completo do arquivo
            }
        });
    }
    return entries;
}

// Diretório de entrada
const adminJsSourceDir = path.resolve(__dirname, 'Admin/js');

// Configuração do Webpack
module.exports = {
    mode: 'production', // Modo de produção para compactação
    entry: generateEntries(adminJsSourceDir, '.js'),
    output: {
        path: path.resolve(__dirname, 'Admin/jsCompiled'), // Diretório de saída
        filename: '[name].COMPILED.js', // Nome do arquivo de saída
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
    plugins: [
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: [
                path.resolve(__dirname, 'Admin/jsCompiled/*'),
            ],
        }), // Limpa o diretório de saída antes de gerar novos arquivos
    ],
};