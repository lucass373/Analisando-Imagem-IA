import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv'
import fs from 'fs';

dotenv.config()
// Configurar a chave da API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Inicializar o gerenciador de arquivos e o modelo generativo
const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);


// Função para fazer upload de uma imagem
async function uploadImage(filePath: string, mimeType: string) {
    const fileName = filePath.split('/').pop() || 'image';
    const uploadResponse = await fileManager.uploadFile(filePath, {
        mimeType,
        displayName: fileName
    });
    return uploadResponse.file.uri;
}

// Função para gerar conteúdo a partir de uma imagem
async function generateContentFromImage(imageUri: string, prompt: string) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent([
        {
            fileData: {
                mimeType: 'image/jpeg',
                fileUri: imageUri
            }
        },
        { text: prompt }
    ]);
    
    // Supondo que o retorno contenha as informações desejadas
    return {
        guid: 'generated-guid', // Altere para o campo correto se necessário
        measure_value: result.response.text(), // Ajuste conforme o retorno da API
        image_url: imageUri
    };
}

// Função para fazer upload de um vídeo
async function uploadVideo(filePath: string, mimeType: string) {
    const fileName = filePath.split('/').pop() || 'video';
    const uploadResponse = await fileManager.uploadFile(filePath, {
        mimeType,
        displayName: fileName
    });
    return uploadResponse.file.uri;
}

// Função para gerar conteúdo a partir de um vídeo
async function generateContentFromVideo(videoUri: string, prompt: string) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent([
        {
            fileData: {
                mimeType: 'video/mp4', // Substitua pelo MIME type real
                fileUri: videoUri
            }
        },
        { text: prompt }
    ]);
    return result.response.text();
}

// Função para listar arquivos
async function listFiles() {
    const listFilesResponse = await fileManager.listFiles();
    return listFilesResponse.files;
}

// Função para excluir um arquivo
async function deleteFile(fileName: string) {
    await fileManager.deleteFile(fileName);
    console.log(`Deleted ${fileName}`);
}

// Função para verificar o estado do arquivo
async function checkFileState(fileName: string) {
    let file = await fileManager.getFile(fileName);
    while (file.state === FileState.PROCESSING) {
        console.log('.');
        await new Promise(resolve => setTimeout(resolve, 10000));
        file = await fileManager.getFile(fileName);
    }
    if (file.state === FileState.FAILED) {
        throw new Error("File processing failed.");
    }
    return file.uri;
}

export {
    uploadImage,
    generateContentFromImage,
    uploadVideo,
    generateContentFromVideo,
    listFiles,
    deleteFile,
    checkFileState
};
