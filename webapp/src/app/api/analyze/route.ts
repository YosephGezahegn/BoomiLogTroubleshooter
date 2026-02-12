/**
 * API Route: /api/analyze
 * Handles log file upload and analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeLogFileWithProgress, validateLogFile, getLogMetadata } from '@/lib/analyzers/logAnalyzer';
import { AnalysisResult } from '@/lib/types/analysis';

// Configure for large file uploads
export const config = {
    api: {
        bodyParser: false, // Disable default body parser for file uploads
    },
};

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * POST /api/analyze
 * Upload and analyze a Boomi log file
 */
export async function POST(request: NextRequest) {
    try {
        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const topN = parseInt(formData.get('topN') as string) || 10;
        const includeFlow = formData.get('includeFlow') === 'true';
        const includeConnectors = formData.get('includeConnectors') === 'true';
        const includePagination = formData.get('includePagination') === 'true';

        // Validate file
        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
                    fileSize: file.size,
                    maxSize: MAX_FILE_SIZE,
                },
                { status: 413 }
            );
        }

        // Check file type (should be .log or .txt)
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.log') && !fileName.endsWith('.txt')) {
            return NextResponse.json(
                {
                    error: 'Invalid file type. Please upload a .log or .txt file',
                    fileName: file.name,
                },
                { status: 400 }
            );
        }

        // Read file content
        const content = await file.text();

        // Validate log file format
        const validation = validateLogFile(content);
        if (!validation.isValid) {
            return NextResponse.json(
                {
                    error: 'Invalid log file format',
                    details: validation.errors,
                    warnings: validation.warnings,
                },
                { status: 400 }
            );
        }

        // Get metadata for logging
        const metadata = getLogMetadata(content);
        console.log(`Analyzing file: ${file.name} (${(file.size / 1024).toFixed(1)}KB, ${metadata.lineCount} lines)`);

        // Analyze the log file
        const startTime = Date.now();

        const result = await analyzeLogFileWithProgress(
            content,
            {
                topN,
                includeFlow,
                includeConnectors,
                includePagination,
            },
            (stage, progress) => {
                console.log(`[${file.name}] ${stage}: ${progress}%`);
            }
        );

        const analysisTime = Date.now() - startTime;
        console.log(`Analysis completed in ${(analysisTime / 1000).toFixed(2)}s`);

        // Add metadata to result
        const enrichedResult = {
            ...result,
            summary: {
                ...result.summary,
                fileName: file.name,
                fileSize: file.size,
            },
            metadata: {
                analysisTime,
                analyzedAt: new Date().toISOString(),
                config: {
                    topN,
                    includeFlow,
                    includeConnectors,
                    includePagination,
                },
            },
        };

        // Return successful response
        return NextResponse.json(enrichedResult, { status: 200 });
    } catch (error) {
        console.error('Analysis error:', error);

        // Handle specific error types
        if (error instanceof Error) {
            return NextResponse.json(
                {
                    error: 'Analysis failed',
                    message: error.message,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                },
                { status: 500 }
            );
        }

        // Generic error
        return NextResponse.json(
            { error: 'An unexpected error occurred during analysis' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/analyze
 * Get API information
 */
export async function GET() {
    return NextResponse.json({
        name: 'Boomi Log Analysis API',
        version: '1.0.0',
        endpoints: {
            POST: {
                description: 'Upload and analyze a Boomi log file',
                parameters: {
                    file: 'File (required) - .log or .txt file',
                    topN: 'number (optional, default: 10) - Number of slowest shapes to return',
                    includeFlow: 'boolean (optional, default: true) - Include process flow diagram',
                    includeConnectors: 'boolean (optional, default: true) - Include connector analysis',
                    includePagination: 'boolean (optional, default: true) - Include pagination detection',
                },
                maxFileSize: `${MAX_FILE_SIZE / (1024 * 1024)}MB`,
                supportedFormats: ['.log', '.txt'],
            },
        },
        status: 'operational',
    });
}
