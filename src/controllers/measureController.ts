import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { measures } from "../models/measureModel";
import { uploadImage, generateContentFromImage } from "../service/geminiService";

// Valida os dados recebidos na requisição
function validateRequestData(req: Request) {
  const { customer_code, measure_datetime, measure_type, image } = req.body;

  if (!customer_code || !measure_datetime || !measure_type || !image) {
    return {
      valid: false,
      error: {
        status: 400,
        code: "INVALID_DATA",
        description: "Missing required fields or file path",
      },
    };
  }

  if (!["WATER", "GAS"].includes(measure_type.toUpperCase())) {
    return {
      valid: false,
      error: {
        status: 400,
        code: "INVALID_TYPE",
        description: "Invalid measure type",
      },
    };
  }

  return { valid: true };
}

// Verifica se uma medição já existe para o mês
function findExistingMeasure(customer_code: string, measure_datetime: string, measure_type: string) {
  return measures.find(
    (m) =>
      m.customer_code === customer_code &&
      m.measures.some(
        (measure) =>
          measure.measure_datetime.toISOString().substring(0, 7) ===
            new Date(measure_datetime).toISOString().substring(0, 7) &&
          measure.measure_type === measure_type.toUpperCase()
      )
  );
}

// Adiciona uma nova medição para o cliente
function addNewMeasure(customer_code: string, newMeasure: any) {
  const customerIndex = measures.findIndex((m) => m.customer_code === customer_code);

  if (customerIndex !== -1) {
    measures[customerIndex].measures.push(newMeasure);
  } else {
    measures.push({
      customer_code,
      measures: [newMeasure],
    });
  }
}

// Processa a medição com base no caminho do arquivo
export const uploadMeasure = async (req: Request, res: Response) => {
  const { customer_code, measure_datetime, measure_type, image } = req.body;

  const validation = validateRequestData(req);
  if (!validation.valid) {
    return res.status(validation.error.status).json({
      error_code: validation.error.code,
      error_description: validation.error.description,
    });
  }

  if (findExistingMeasure(customer_code, measure_datetime, measure_type)) {
    return res.status(409).json({
      error_code: "DOUBLE_REPORT",
      error_description: "Leitura do mês já realizada",
    });
  }

  const imagePath = path.resolve(image);
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({
      error_code: "FILE_NOT_FOUND",
      error_description: "File not found",
    });
  }

  try {
    const imageUri = await uploadImage(imagePath, "image/jpeg");
    const analysisResult = await generateContentFromImage(imageUri, "Analyze the measure value in this image, only show me the number");

    const newMeasure = {
      measure_uuid: analysisResult.guid,
      measure_datetime: new Date(measure_datetime),
      measure_type: measure_type.toUpperCase(),
      has_confirmed: false,
      image_url: imageUri,
      measure_value: analysisResult.measure_value,
    };

    addNewMeasure(customer_code, newMeasure);

    res.status(200).json({
      image_url: newMeasure.image_url,
      measure_value: newMeasure.measure_value,
      measure_uuid: newMeasure.measure_uuid,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      error_code: "INTERNAL_ERROR",
      error_description: "Error processing request",
    });
  }
};

// Confirma a medição
export const confirmMeasure = (req: Request, res: Response) => {
  const { measure_uuid, confirmed_value } = req.body;

  if (!measure_uuid || confirmed_value === undefined) {
    return res.status(400).json({
      error_code: "INVALID_DATA",
      error_description: "Missing required fields",
    });
  }

  const customerMeasure = measures.flatMap((m) => m.measures).find((m) => m.measure_uuid === measure_uuid);

  if (!customerMeasure) {
    return res.status(404).json({
      error_code: "MEASURE_NOT_FOUND",
      error_description: "Measure not found",
    });
  }

  if (customerMeasure.has_confirmed) {
    return res.status(409).json({
      error_code: "CONFIRMATION_DUPLICATE",
      error_description: "Measure already confirmed",
    });
  }

  customerMeasure.has_confirmed = true;
  customerMeasure.measure_value = confirmed_value;

  res.status(200).json({ success: true });
};

// Lista as medições de um cliente
export const listMeasures = (req: Request, res: Response) => {
  const { customer_code } = req.params;
  const { measure_type } = req.query;

  const customerMeasure = measures.find((m) => m.customer_code === customer_code);

  if (!customerMeasure) {
    return res.status(404).json({
      error_code: "MEASURES_NOT_FOUND",
      error_description: "No measures found for this customer",
    });
  }

  const filteredMeasures = measure_type
    ? customerMeasure.measures.filter(
        (m) => m.measure_type.toLowerCase() === (measure_type as string).toLowerCase()
      )
    : customerMeasure.measures;

  res.status(200).json({
    customer_code,
    measures: filteredMeasures,
  });
};
