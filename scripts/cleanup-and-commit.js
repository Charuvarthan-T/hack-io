const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const targetDirs = ['app', 'components', 'lib', 'repository', 'scripts', 'hooks', 'types'];
const extensions = ['.ts', '.tsx', '.js', '.jsx'];
function removeComments(code) {
    let cleaned = code.replace(/\/\*[\s\S]*?\*\
    const lines = cleaned.split('\n');
    const processedLines = lines.map(line => {
        if (!line.includes('//')) return line;
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
                if (i > 0 && line[i-1] === ':') {
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
    cleaned = cleaned.replace(/\s+$/gm, '');
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
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
                    const fileName = path.basename(relativePath);
                    execSync(`git commit -m "${fileName} after leaderboard integration and push to github"`);
                } catch (e) {
                    console.error(`Failed to commit ${relativePath}:`, e.message);
                }
            } else {
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
