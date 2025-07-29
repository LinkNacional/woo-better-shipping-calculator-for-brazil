const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

// Função para gerar entradas dinâmicas com base nos arquivos em uma pasta
function generateEntries(sourceDir, extension) {
    const entries = {};
    if (fs.existsSync(sourceDir)) {
        const files = fs.readdirSync(sourceDir);
        files.forEach(file => {
            if (file.endsWith(extension)) {
                const name = path.basename(file, extension); // Nome base do arquivo
                entries[name] = path.join(sourceDir, file); // Nome único para cada entrada
            }
        });
    }
    return entries;
}

// Diretórios de entrada e saída
const publicCssSourceDir = path.resolve(__dirname, 'Public/css');
const adminCssSourceDir = path.resolve(__dirname, 'Admin/css');

// Configuração do Webpack para CSS
module.exports = {
    mode: 'production', // Modo de produção para compactação
    entry: {
        ...generateEntries(publicCssSourceDir, '.css'),
        ...generateEntries(adminCssSourceDir, '.css'),
    },
    output: {
        path: path.resolve(__dirname), // Diretório base para saída
        filename: '[name].js', // Nome do arquivo de saída (não será usado para CSS)
    },
    module: {
        rules: [
            {
                test: /\.css$/, // Aplica a regra para arquivos .css
                use: [
                    MiniCssExtractPlugin.loader, // Extrai o CSS para um arquivo separado
                    'css-loader', // Carrega e processa o CSS
                ],
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: (pathData) => {
                // Salva os arquivos CSS compilados na pasta correta
                const outputDir = pathData.chunk.name.includes('Public')
                    ? 'Public/cssCompiled'
                    : 'Admin/cssCompiled';
                return `${outputDir}/[name].COMPILED.css`;
            },
        }),
    ],
    optimization: {
        minimize: true, // Ativa a minimização
        minimizer: [
            `...`, // Preserva os minimizadores padrão do Webpack
            new CssMinimizerPlugin(), // Minimiza o CSS
        ],
    },
};