import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv'

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

export {
    uploadImage,
    generateContentFromImage,
};
