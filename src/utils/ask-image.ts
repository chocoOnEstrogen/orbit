import path from 'path'
import { createCanvas } from '@napi-rs/canvas'
import fs from 'fs'
import os from 'os'
import { v4 as uuidv4 } from 'uuid'

const TEMP_DIR = path.join(os.tmpdir())

interface TimeBasedColors {
    background: {
        start: string;
        end: string;
    };
    decorative: string;
    questionMark: string;
    questionText: string;
    answerText: string;
    watermark: string;
}

function getTimeBasedColors(): TimeBasedColors {
    const hour = new Date().getHours();

    // Dawn (5-8)
    if (hour >= 5 && hour < 8) {
        return {
            background: { start: '#FF7B54', end: '#FFB26B' }, // Warm sunrise colors
            decorative: '#ffffff20',
            questionMark: '#FFD56F90',
            questionText: '#ffffff',
            answerText: '#FFD56F',
            watermark: '#ffffff70'
        };
    }
    // Day (8-16)
    else if (hour >= 8 && hour < 16) {
        return {
            background: { start: '#40128B', end: '#9336B4' }, // Vibrant day colors
            decorative: '#ffffff15',
            questionMark: '#DD58D690',
            questionText: '#ffffff',
            answerText: '#DD58D6',
            watermark: '#ffffff50'
        };
    }
    // Dusk (16-20)
    else if (hour >= 16 && hour < 20) {
        return {
            background: { start: '#472D2D', end: '#553939' }, // Sunset colors
            decorative: '#ffffff18',
            questionMark: '#A7797990',
            questionText: '#ffffff',
            answerText: '#A77979',
            watermark: '#ffffff60'
        };
    }
    // Night (20-5)
    else {
        return {
            background: { start: '#1a1a1a', end: '#2d1f3d' }, // Dark night colors
            decorative: '#ffffff10',
            questionMark: '#9333ea80',
            questionText: '#ffffff',
            answerText: '#9333ea',
            watermark: '#ffffff50'
        };
    }
}

export async function generateQuestionImage(question: string, answer: string): Promise<{ filePath: string; width: number; height: number }> {
    // Create canvas
    const width = 1200
    const height = 630
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    const colors = getTimeBasedColors()

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, colors.background.start)
    gradient.addColorStop(1, colors.background.end)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Add decorative elements
    ctx.fillStyle = colors.decorative
    ctx.beginPath()
    ctx.arc(100, 100, 200, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(width - 100, height - 100, 150, 0, Math.PI * 2)
    ctx.fill()

    // Draw question mark icon
    ctx.fillStyle = colors.questionMark
    ctx.font = 'bold 120px Inter'
    ctx.textAlign = 'center'
    ctx.fillText('?', width / 2, 180)

    // Draw question text
    ctx.fillStyle = colors.questionText
    ctx.font = 'bold 40px Inter'
    ctx.textAlign = 'center'

    // Word wrap the question
    const words = question.split(' ')
    const lines: string[] = []
    let currentLine = ''
    const maxWidth = width - 100 // Padding on both sides

    words.forEach(word => {
        const testLine = currentLine + word + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && currentLine !== '') {
            lines.push(currentLine.trim())
            currentLine = word + ' '
        } else {
            currentLine = testLine
        }
    })
    lines.push(currentLine.trim())

    // Draw lines
    let y = height / 2 - 50
    lines.forEach((line, i) => {
        ctx.fillText(line, width / 2, y + (i * 50))
    })

    // Draw answer text
    ctx.fillStyle = colors.answerText
    ctx.font = 'bold 32px Inter'
    const answerLines: string[] = []
    let currentAnswerLine = ''
    const answerWords = answer.split(' ')

    answerWords.forEach(word => {
        const testLine = currentAnswerLine + word + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && currentAnswerLine !== '') {
            answerLines.push(currentAnswerLine.trim())
            currentAnswerLine = word + ' '
        } else {
            currentAnswerLine = testLine
        }
    })
    answerLines.push(currentAnswerLine.trim())

    // Draw answer lines
    y = y + (lines.length * 50) + 50
    answerLines.forEach((line, i) => {
        ctx.fillText(line, width / 2, y + (i * 50))
    })

    // Add watermark
    ctx.font = '24px Inter'
    ctx.fillStyle = colors.watermark
    ctx.fillText('asked on choco.rip/ask', width / 2, height - 40)

    // Convert canvas to buffer
    const data = canvas.toBuffer('image/png')
    const filePath = path.join(TEMP_DIR, `${uuidv4()}.png`)
    fs.writeFileSync(filePath, data)


    return { filePath, width, height }
}