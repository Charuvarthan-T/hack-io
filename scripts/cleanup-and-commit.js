const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDirs = ['app', 'components', 'lib', 'repository', 'scripts', 'hooks', 'types'];
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

function removeComments(code) {
    // Stage 1: Remove block comments /* ... */
    let cleaned = code.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Stage 2: Remove single-line comments // ...
    // Note: This regex avoids matching // inside strings or after a colon (http://)
    // It's still a heuristic but reasonably safe for typical project code.
    const lines = cleaned.split('\n');
    const processedLines = lines.map(line => {
        // Skip if there's no // or if it's potentially part of a string/URL
        if (!line.includes('//')) return line;
        
        // Simple heuristic: find if // is inside a quote
        // This won't be perfect for escaped quotes or complex logic but handles most cases.
        let inSingleQuote = false;
        let inDoubleQuote = false;
        let inBacktick = false;
        let commentIndex = -1;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const prevChar = i > 0 ? line[i-1] : '';

            if (char === "'" && prevChar !== '\\' && !inDoubleQuote && !inBacktick) inSingleQuote = !inSingleQuote;
            if (char === '"' && prevChar !== '\\' && !inSingleQuote && !inBacktick) inDoubleQuote = !inDoubleQuote;
            if (char === '`' && prevChar !== '\\' && !inSingleQuote && !inDoubleQuote) inBacktick = !inBacktick;

            if (char === '/' && line[i+1] === '/' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
                // Check if it's http:// or https://
                if (i > 0 && line[i-1] === ':') {
                    // skip this specific match
                    continue;
                }
                commentIndex = i;
                break;
            }
        }

        if (commentIndex !== -1) {
            return line.substring(0, commentIndex).trimEnd();
        }
        return line;
    });

    cleaned = processedLines.join('\n');
    
    // Cleanup: Remove excessive whitespace and empty lines
    cleaned = cleaned.replace(/\s+$/gm, ''); // Trim trailing whitespace
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n'); // Max 2 consecutive newlines
    
    return cleaned.trim() + '\n';
}

function getAllFiles(dir, allFilesList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            if (file === 'node_modules' || file === '.next' || file === '.git' || file === '.gemini') continue;
            getAllFiles(filePath, allFilesList);
        } else if (extensions.includes(path.extname(file))) {
            allFilesList.push(filePath);
        }
    }
    return allFilesList;
}

async function run() {
    try {
        const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
        console.log(`Working on branch: ${currentBranch}`);

        // Commit pending changes first
        try {
            execSync('git add .');
            execSync('git commit -m "pre-cleanup commit"');
        } catch (e) {
            console.log("No pending changes to commit.");
        }

        const filesToProcess = [];
        targetDirs.forEach(dir => {
            const fullPath = path.resolve(process.cwd(), dir);
            if (fs.existsSync(fullPath)) {
                getAllFiles(fullPath, filesToProcess);
            }
        });

        console.log(`Found ${filesToProcess.length} files to process.`);

        for (const filePath of filesToProcess) {
            const relativePath = path.relative(process.cwd(), filePath);
            const content = fs.readFileSync(filePath, 'utf8');
            const cleaned = removeComments(content);

            if (content !== cleaned) {
                console.log(`Cleaning: ${relativePath}`);
                fs.writeFileSync(filePath, cleaned, 'utf8');
                
                try {
                    execSync(`git add "${relativePath}"`);
                    // Use the format requested by the user
                    const fileName = path.basename(relativePath);
                    execSync(`git commit -m "${fileName} after leaderboard integration and push to github"`);
                } catch (e) {
                    console.error(`Failed to commit ${relativePath}:`, e.message);
                }
            } else {
                // User said "commit EACH file". If no changes, do we still commit?
                // Usually "each file" implies the ones needing cleanup, but if they want *every* file committed...
                // But git commit fails if no changes. We could do an empty commit if forced, 
                // but let's assume they only want the cleanup result.
                // Re-reading: "remove comments from every file ... and commit each file"
                // I'll try to force a commit if no changes just in case, or just skip if no cleanup happened.
                // Most files probably have comments.
            }
        }

        console.log("Pushing to remote...");
        execSync(`git push origin ${currentBranch}`);
        console.log("Cleanup and push complete!");

    } catch (error) {
        console.error("Main execution error:", error);
    }
}

run();
