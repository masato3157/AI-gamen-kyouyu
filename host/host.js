#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// Define where to save the files. 
// Ideally, we want to save to the user's playground or a specific location.
// Since the user wants to "see" it in Antigravity, we should save to the playground workspace if possible,
// OR save to the same folder as the extension and assume Antigravity can read it (which it can't if not in workspace).
// However, the goal is for Antigravity to READ it.
// The user's current workspace is: c:\Users\kaba1\.gemini\antigravity\playground\polar-feynman
// So we should try to save there.
const TARGET_DIR = 'C:\\Users\\kaba1\\.gemini\\antigravity\\playground\\polar-feynman';
const CAPTURE_FILE = path.join(TARGET_DIR, 'capture.png');
const METADATA_FILE = path.join(TARGET_DIR, 'capture.json');

// Helper to log errors (Native messaging stderr goes to chrome error log if configured, but usually lost)
function log(msg) {
    // fs.appendFileSync(path.join(__dirname, 'debug.log'), msg + '\n');
}

// Native Messaging protocol:
// 1. Read 4 bytes (little-endian) length
// 2. Read 'length' bytes of JSON
async function readMessage() {
    return new Promise((resolve, reject) => {
        let lenBuffer = Buffer.alloc(0);
        
        // Read length first
        process.stdin.once('readable', () => {
             // If we already have chunks
             let chunk;
             while ((chunk = process.stdin.read()) !== null) {
                 if (lenBuffer.length < 4) {
                     // Need more bytes for length
                     const needed = 4 - lenBuffer.length;
                     const taken = chunk.slice(0, needed);
                     lenBuffer = Buffer.concat([lenBuffer, taken]);
                     
                     if (lenBuffer.length === 4) {
                         // Got length
                         const len = lenBuffer.readUInt32LE(0);
                         const rest = chunk.slice(needed);
                         
                         // Now read the message body
                         // If 'rest' has the whole message, great.
                         // Otherwise we need to read more.
                         // For simplicity in this specialized script, 
                         // we can just read the rest of stdin if it's a single message flow, 
                         // but native messaging keeps the stream open.
                         // Implementing a proper buffer reader is safer.
                         readBody(len, rest).then(resolve).catch(reject);
                         return; // Stop processing this chunk loop, handing off to readBody
                     }
                 }
             }
        });
    });
}

// Simple buffer accumulator
let inputBuffer = Buffer.alloc(0);
let expectedLength = null;

process.stdin.on('data', (chunk) => {
    inputBuffer = Buffer.concat([inputBuffer, chunk]);
    
    while (true) {
        if (expectedLength === null) {
            if (inputBuffer.length >= 4) {
                expectedLength = inputBuffer.readUInt32LE(0);
                inputBuffer = inputBuffer.slice(4);
            } else {
                break; // Not enough data for length
            }
        }
        
        if (expectedLength !== null) {
            if (inputBuffer.length >= expectedLength) {
                const msgBuf = inputBuffer.slice(0, expectedLength);
                inputBuffer = inputBuffer.slice(expectedLength);
                const len = expectedLength;
                expectedLength = null;
                
                try {
                    const msg = JSON.parse(msgBuf.toString('utf8'));
                    handleMessage(msg);
                } catch (e) {
                    log('Error parsing JSON: ' + e.message);
                }
            } else {
                break; // Not enough data for message
            }
        }
    }
});

function handleMessage(msg) {
    if (msg.image) {
        try {
            // Remove header "data:image/png;base64,"
            const base64Data = msg.image.replace(/^data:image\/png;base64,/, "");
            
            fs.writeFileSync(CAPTURE_FILE, base64Data, 'base64');
            fs.writeFileSync(METADATA_FILE, JSON.stringify({
                url: msg.url,
                title: msg.title,
                timestamp: new Date().toISOString()
            }, null, 2));
            
            sendMessage({ status: "success", path: CAPTURE_FILE });
        } catch (e) {
            sendMessage({ status: "error", message: e.message });
        }
    } else {
        sendMessage({ status: "error", message: "No image data found" });
    }
}

function sendMessage(msg) {
    const json = JSON.stringify(msg);
    const len = Buffer.byteLength(json, 'utf8');
    const header = Buffer.alloc(4);
    header.writeUInt32LE(len, 0);
    
    process.stdout.write(header);
    process.stdout.write(json);
}

// Keep process alive
process.stdin.resume();
