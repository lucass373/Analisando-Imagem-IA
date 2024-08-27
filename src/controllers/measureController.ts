import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { measures } from '../models/measureModel';
import { uploadImage, generateContentFromImage } from '../service/geminiService';

// Função para processar a medida com base no caminho do arquivo
export const uploadMeasure = async (req: Request, res: Response) => {
  const { customer_code, measure_datetime, measure_type, image_path } = req.body;

  if (!customer_code || !measure_datetime || !measure_type || !image_path) {
    return res.status(400).json({
      error_code: 'INVALID_DATA',
      error_description: 'Missing required fields or file path'
    });
  }

  if (!['WATER', 'GAS'].includes(measure_type.toUpperCase())) {
    return res.status(400).json({
      error_code: 'INVALID_TYPE',
      error_description: 'Invalid measure type'
    });
  }

  try {
    const existingMeasure = measures.find(
      m => m.customer_code === customer_code &&
           m.measures.some(measure => measure.measure_datetime.toISOString().substring(0, 7) === new Date(measure_datetime).toISOString().substring(0, 7) &&
                                         measure.measure_type === measure_type.toUpperCase())
    );

    if (existingMeasure) {
      return res.status(409).json({
        error_code: 'DOUBLE_REPORT',
        error_description: 'Leitura do mês já realizada'
      });
    }

    // Caminho do arquivo recebido
    const imagePath = path.resolve(image_path);

    // Verificar se o arquivo existe
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        error_code: 'FILE_NOT_FOUND',
        error_description: 'File not found'
      });
    }

    // Fazer upload da imagem e gerar conteúdo
    const imageUri = await uploadImage(imagePath, 'image/jpeg'); // ou o tipo MIME correto
    const analysisResult = await generateContentFromImage(imageUri, "Analyze the measure value in this image");

    const newMeasure = {
      measure_uuid: analysisResult.guid,
      measure_datetime: new Date(measure_datetime),
      measure_type: measure_type.toUpperCase(),
      has_confirmed: false,
      image_url: imageUri,
      measure_value: analysisResult.measure_value
    };

    const customerIndex = measures.findIndex(m => m.customer_code === customer_code);

    if (customerIndex !== -1) {
      measures[customerIndex].measures.push(newMeasure);
    } else {
      measures.push({
        customer_code,
        measures: [newMeasure]
      });
    }

    res.status(200).json({
      image_url: newMeasure.image_url,
      measure_value: newMeasure.measure_value,
      measure_uuid: newMeasure.measure_uuid
    });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      error_code: 'INTERNAL_ERROR',
      error_description: 'Error processing request'
    });
  }
};

// Mantém a função confirmMeasure
export const confirmMeasure = (req: Request, res: Response) => {
  const { measure_uuid, confirmed_value } = req.body;

  if (!measure_uuid || confirmed_value === undefined) {
    return res.status(400).json({
      error_code: 'INVALID_DATA',
      error_description: 'Missing required fields'
    });
  }

  const customerMeasure = measures.flatMap(m => m.measures).find(m => m.measure_uuid === measure_uuid);

  if (!customerMeasure) {
    return res.status(404).json({
      error_code: 'MEASURE_NOT_FOUND',
      error_description: 'Measure not found'
    });
  }

  if (customerMeasure.has_confirmed) {
    return res.status(409).json({
      error_code: 'CONFIRMATION_DUPLICATE',
      error_description: 'Measure already confirmed'
    });
  }

  customerMeasure.has_confirmed = true;
  customerMeasure.measure_value = confirmed_value;

  res.status(200).json({
    success: true
  });
};

// Mantém a função listMeasures
export const listMeasures = (req: Request, res: Response) => {
  const { customer_code } = req.params;
  const { measure_type } = req.query;

  const customerMeasure = measures.find(m => m.customer_code === customer_code);

  if (!customerMeasure) {
    return res.status(404).json({
      error_code: 'MEASURES_NOT_FOUND',
      error_description: 'No measures found for this customer'
    });
  }

  const filteredMeasures = measure_type
    ? customerMeasure.measures.filter(m => m.measure_type.toLowerCase() === (measure_type as string).toLowerCase())
    : customerMeasure.measures;

  res.status(200).json({
    customer_code,
    measures: filteredMeasures
  });
};
