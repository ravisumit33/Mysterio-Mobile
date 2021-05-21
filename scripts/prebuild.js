const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const fse = require('fs-extra');
const rimraf = require('rimraf');

function renameOutputFolder(buildFolderPath, outputFolderPath) {
    return new Promise((resolve, reject) => {
        fs.rename(buildFolderPath, outputFolderPath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve('Successfully built!');
            }
        });
    });
}

function rejectError(error, reject) {
    if (error) {
        console.error(error);
        reject(error);
        return true;
    }
    return false;
}

function execPreReactBuild(mysterioPath, rootPath) {
    return new Promise((resolve, reject) => {
        exec('cd ' + mysterioPath + ' && git ls-remote origin refs/heads/master', (error, stdout, stderror) => {
            if (rejectError(error || stderror))
                return;
            console.log(stdout);
            var remoteHead = stdout.split('\t')[0];
            console.log(remoteHead);
            exec('git rev-parse HEAD', (error, stdout, stderror) => {
                if (rejectError(error || stderror))
                    return;
                console.log(stdout);
                var localHead = stdout;
                exec('cd ..', (error, stdout, stderror) => {
                    if (rejectError(error || stderror))
                        return;
                    if (localHead !== remoteHead) {
                        exec('git submodule foreach git pull origin master && git commit -am "Update Mysterio to latest"', (error, stdout, stderror) => {
                            if (rejectError(error || stderror))
                                return;
                            console.log("Mysterio updated");
                            resolve();
                        });
                    }

                });                    
            });
        }); 
    });
}

function execPostReactBuild(buildFolderPath, outputFolderPath) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(buildFolderPath)) {
            if (fs.existsSync(outputFolderPath)) {
                rimraf(outputFolderPath, (err) => {
                    if (rejectError(error || stderror))
                        return;
                    renameOutputFolder(buildFolderPath, outputFolderPath)
                        .then(val => resolve(val))
                        .catch(e => reject(e));
                });
            } else {
                renameOutputFolder(buildFolderPath, outputFolderPath)
                    .then(val => resolve(val))
                    .catch(e => reject(e));
            }
        } else {
            reject(new Error('build folder does not exist'));
        } 
    });
}

const P = () => {
    const projectPath = path.resolve(process.cwd(), './node_modules/.bin/react-scripts');
    return new Promise((resolve, reject) => {
        execPreReactBuild(path.resolve(__dirname, '../Mysterio'), path.join(__dirname, '../'), (error, stdout, stderror) => {
            exec(`${projectPath} build`, (error) => {
                if (rejectError(error || stderror))
                    return;
                execPostReactBuild(path.resolve(__dirname, '../build/'), path.join(__dirname, '../www/'))
                    .then((s) => {
                        console.log(s);
                        resolve(s);
                    })
                    .catch((e) => {
                        if (rejectError(error || stderror))
                            return;
                    });
                });
        });
    });
};

P().then(() => console.log("complete")).catch((error) => console.error(error));
