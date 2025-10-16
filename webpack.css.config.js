const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const IgnoreEmitPlugin = require('ignore-emit-webpack-plugin');

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
    mode: 'production',
    entry: {
        ...generateEntries(publicCssSourceDir, '.css'),
        ...generateEntries(adminCssSourceDir, '.css'),
    },
    // Removido output.filename para evitar arquivos JS vazios
    output: {
        path: path.resolve(__dirname),
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                ],
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: (pathData) => {
                const outputDir = pathData.chunk.name.includes('Public')
                    ? 'Public/cssCompiled'
                    : 'Admin/cssCompiled';
                return `${outputDir}/[name].COMPILED.css`;
            },
            experimentalUseImportModule: false,
        }),
        // Ignora todos arquivos .js gerados para entradas CSS
        new IgnoreEmitPlugin(/^.*\.js$/),
    ],
    optimization: {
        minimize: true,
        minimizer: [
            `...`,
            new CssMinimizerPlugin(),
        ],
    },
};