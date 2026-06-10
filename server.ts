/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// CORS preflight and request acceptance middleware for cross-origin hosting (e.g. Vercel)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Lazy-initialized Gemini AI client following safety constraints
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required but missing.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    time: new Date().toISOString(),
    branch: 'PCEA Tumutumu Hospital Karatina Satellite Branch',
  });
});

// Board Report AI Generation (using Server-Side Gemini)
app.post('/api/generate-quality-report', async (req, res) => {
  try {
    const stats = req.body;

    if (!stats) {
      return res.status(400).json({ error: 'Stats payload is required' });
    }

    let ai;
    try {
      ai = getAiClient();
    } catch (err: any) {
      return res.status(500).json({
        error: 'AI Initialization Error',
        message: err.message || 'Please configure the GEMINI_API_KEY inside Settings > Secrets.',
      });
    }

    const {
      patientCount = 0,
      generalCount = 0,
      consultantCount = 0,
      surgicalCount = 0,
      pediatricsCount = 0,
      mopcCount = 0,
      obsGynCount = 0,
      labTestsCount = 0,
      labRevenue = 0,
      pharmacyDispensed = 0,
      pharmacyRevenue = 0,
      totalRevenue = 0,
      staffCount = 0,
      leavePendingCount = 0,
    } = stats;

    const systemInstruction = `You are an expert Head of Satellites Dr. Gladys Wanjiku and Quality Assurance consultant for PCEA Tumutumu Hospital.
Your responsibility is to analyze hospital operational metrics and formulate a highly professional, clinical, and administrative "Quality Report for the Board of Management" for the Karatina Satellite Branch, officially issued by the Head of Satellites Dr. Gladys Wanjiku.
Use prestigious healthcare leadership language, formal formatting, clear sections (with bold headings, lists, and markdown tables if helpful). Be descriptive, highlighting bottlenecks and strategic insights.
Do not use placeholders. Act on the real numbers provided.`;

    const prompt = `Please generate an Executive Board Quality Report for the PCEA Tumutumu Hospital Karatina Satellite Branch based on this clinical period's statistics:

OPERATIONAL STATISTICS:
- Total Patients Registered & Attended: ${patientCount}
  * General Consultation Patients: ${generalCount}
  * Consultant Clinic Patients: ${consultantCount} (Surgical: ${surgicalCount}, Pediatrics: ${pediatricsCount}, MOPC: ${mopcCount}, Obs/Gyn: ${obsGynCount})
- Laboratory Department:
  * Total Diagnostics Tests Administered: ${labTestsCount}
  * Total Lab Diagnostic Revenue: Ksh ${labRevenue.toLocaleString()}
- Pharmacy Department:
  * Total Prescriptions/Medications Dispensed: ${pharmacyDispensed}
  * Total Pharmacy Revenue: Ksh ${pharmacyRevenue.toLocaleString()}
- Finance Combined Summary:
  * Total Branch Revenue Generated: Ksh ${totalRevenue.toLocaleString()}
- Human Resources & Duty Rosters:
  * Active Rotated Clinical Staff: ${staffCount}
  * Leaves Pending Review: ${leavePendingCount}

Create a beautifully formatted medical administrative board report with the following structure:
1. EXECUTIVE SUMMARY & STRATEGIC STANDARDS (Acknowledge the role of Karatina Satellite in streamlining Tumutumu records).
2. PATIENT FLOWS AND CLINICAL DEMOGRAPHICS ANALYSIS (Specifically discuss general vs specialized clinic split (Surgical, Pediatrics, MOPC, Obs/Gyn) to explain triage efficiency).
3. FINANCIAL PERFORMANCE & REVENUE PER DEPARTMENT (Compare Lab and Pharmacy contributions. Offer insights into resource utilization).
4. CLINICAL QUALITY METRICS & BOTTLENECK REMEDIALS (Analyze if lab tests per patient or medications per patient match hospital quality standards; suggest adjustments for patient comfort).
5. BOARD APPROVALS AND HUMAN RESOURCE WORKFLOWS (Comment on staff duty load and status of leave requests).
6. ACTIONABLE STRATEGIC RECOMMENDATIONS FOR THE KARATINA BOARD (Provide 3 clear, numbered medical satellite optimization goals).`;

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2, // low temperature for formal administrative reasoning
      },
    });

    const markdownText = aiResponse.text || 'Unable to generate board report at this time.';
    res.json({ success: true, report: markdownText });
  } catch (error: any) {
    console.error('Error generating quality report:', error);
    res.status(500).json({
      error: 'Failed to generate board quality report',
      message: error.message || 'Unknown internal error',
    });
  }
});

// Intelligent Deep Document Extractor using Gemini Multimodal input
app.post('/api/parse-document', async (req, res) => {
  try {
    const { fileData, mimeType, dataType } = req.body;

    if (!fileData || !mimeType || !dataType) {
      return res.status(400).json({ error: 'Missing required parameters: fileData, mimeType, or dataType' });
    }

    let ai;
    try {
      ai = getAiClient();
    } catch (err: any) {
      return res.status(500).json({
        error: 'AI Initialization Error',
        message: err.message || 'Please configure the GEMINI_API_KEY inside Settings > Secrets.',
      });
    }

    let prompt = '';
    let responseSchema: any;

    if (dataType === 'labTestsCatalog') {
      prompt = `Carefully extract all laboratory panels, diagnostics tests and their fees/prices from the attached document. 
Identify the columns corresponding to test name and price. Map them to a high-fidelity JSON array under the 'items' key.`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            description: 'List of lab test catalog items extracted from the document',
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: 'The name of the laboratory panel (e.g., Malaria Slide/RDT test)'
                },
                fee: {
                  type: Type.NUMBER,
                  description: 'The fee/charge in Kenyan Shillings (Ksh) for this test'
                }
              },
              required: ['name', 'fee']
            }
          }
        },
        required: ['items']
      };
    } else if (dataType === 'pharmacyStock') {
      prompt = `Carefully extract all medications, pharmaceutical stock, and non-pharmaceutical supplies from the attached document. 
Identify columns for name, item quantity or stock intake, and unit price. Map them to a high-fidelity JSON array under the 'items' key.
Make sure to classify them accurately. If an item is a clinical supply (like syringes, gloves, bandages, needles, cotton, cannulas, dressing, tubing), assign the category 'Non-Pharmaceutical'. 
Otherwise, classify under standard drug types like 'Antibiotics', 'Analgesics', 'Anti-malarials', 'Anti-histamines', or 'Supplements'.`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            description: 'List of pharmacy stock items extracted from the document',
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: 'The name of the medication or non-pharma supply'
                },
                price: {
                  type: Type.NUMBER,
                  description: 'The unit price/fee'
                },
                stockQuantity: {
                  type: Type.NUMBER,
                  description: 'Stock dynamic intake level (default to 100 if not clear)'
                },
                category: {
                  type: Type.STRING,
                  description: 'Must match one of: "Antibiotics", "Analgesics", "Anti-malarials", "Anti-histamines", "Supplements", or "Non-Pharmaceutical"'
                },
                minThreshold: {
                  type: Type.NUMBER,
                  description: 'Minimum stock alert threshold (default to 15 if missing)'
                }
              },
              required: ['name', 'price', 'stockQuantity', 'category']
            }
          }
        },
        required: ['items']
      };
    } else {
      return res.status(400).json({ error: 'Invalid dataType parameter' });
    }

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: fileData,
              mimeType: mimeType
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.1,
      }
    });

    const resultText = aiResponse.text;
    if (!resultText) {
      throw new Error('Empty response received from parsing model.');
    }

    const parsedJson = JSON.parse(resultText);
    res.json({ success: true, ...parsedJson });
  } catch (error: any) {
    console.error('Error parsing document via Gemini:', error);
    res.status(500).json({
      error: 'Failed to parse document',
      message: error.message || 'Unknown internal error',
    });
  }
});

// Configure Vite or Serve SPA
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Starting Express server in DEVELOPMENT mode with Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Mount Vite middleware
    app.use(vite.middlewares);
  } else {
    console.log('Starting Express server in PRODUCTION mode with compiled assets...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PCEA Tumutumu Karatina Branch portal running successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
