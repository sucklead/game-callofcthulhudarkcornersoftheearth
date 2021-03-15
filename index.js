// Nexus Mods domain for the game.
const GAME_ID = 'callofcthulhudarkcornersoftheearth';

//GOG Application ID, you can get this from https://www.gogdb.org/
const GOGAPP_ID = '1189711155';

const MOD_FILE_NAF = ".naf";
const MOD_FILE_XBD = ".xbd";
const MOD_FILE_BMP = ".bmp";
const MOD_FILE_TGA = ".tga";
const MOD_FILE_DDS = ".dds";
const MOD_FILE_EXE = ".exe";
const MOD_FILE_DLL = ".dll";
const MOD_FILE_VSO = ".vso";
const MOD_FILE_PSO = ".pso";

const { resolveSoa } = require('dns');
//Import some assets from Vortex we'll need.
const path = require('path');
const { fs, log, util } = require('vortex-api');

function main(context) {
	//This is the main function Vortex will run when detecting the game extension. 
  context.registerGame({
    id: GAME_ID,
    name: 'Call of Cthulhu: Dark Corners of the Earth',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: [],
    queryModPath: () => 'mods',
    logo: 'assets/cocdcote_logo.jpg',
    executable: () => 'mods/Engine/DCoTEHook.exe',
    requiredFiles: [
      'Engine/CoCMainWin32.exe',
      'Scripts/01_house.bat',
      'Resources/Xbox/01_HOUSE.pc.xbd',
      'Resources/Xbox/01_HOUSE.xbd'
    ],
    setup: (discovery) => prepareForModding(discovery, context.api),
    details: {
      gogAppId: GOGAPP_ID
    }
  });

  context.registerInstaller('callofcthulhudarkcornersoftheearth-mod', 25, (files, gameId) => testSupportedContent(context, files, gameId), (files) => installContent(context, files));

	return true
}

function testSupportedContent(context, files, gameId) {
  context.api.sendNotification({
    id: 'dcote-test-support-notification',
    type: 'warning',
    title: 'GameId ' + gameId,
    message: files[0],
    actions: []
  });

  // Make sure we're able to support this mod.
  let supported = (gameId === GAME_ID);

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function installContent(context, files) {

  const modFiles = files.filter(file => path.extname(file).toLowerCase() === MOD_FILE_NAF
                                        || path.extname(file).toLowerCase() === MOD_FILE_XBD
                                        || path.extname(file).toLowerCase() === MOD_FILE_BMP
                                        || path.extname(file).toLowerCase() === MOD_FILE_EXE
                                        || path.extname(file).toLowerCase() === MOD_FILE_DLL
                                        || path.extname(file).toLowerCase() === MOD_FILE_VSO
                                        || path.extname(file).toLowerCase() === MOD_FILE_PSO
                                        || path.extname(file).toLowerCase() === MOD_FILE_TGA
                                        || path.extname(file).toLowerCase() === MOD_FILE_DDS);

  const instructions = modFiles.map(file => {
    context.api.sendNotification({
      id: 'dcote-test-install-notification',
      type: 'warning',
      title: 'files',
      message: file,
      actions: []
    });

    return {
      type: 'copy',
      source: file,
      destination: file
    };
  });

  return Promise.resolve({ instructions });
}

function findGame() {
  try {
    console.debug("Trying retail x86 path...");
    const retailx86Path = "C:\\Program Files (x86)\\Bethesda Softworks\\Call Of Cthulhu DCoTE";
    if (fs.existsSync(retailx86Path)) {
      console.debug("Found retail x86 path!");
      return Promise.resolve(retailx86Path);
    }

    console.debug("Trying retail x64 path...");
    const retailx64Path = "C:\\Program Files\\Bethesda Softworks\\Call Of Cthulhu DCoTE";
    if (fs.existsSync(retailx64Path)) {
      console.debug("Found retail x64 path!");
      return Promise.resolve(retailx64Path);
    }

    console.debug("Trying my path...");
    const myPath = "S:\\Games\\Call Of Cthulhu DCoTE";
    if (fs.existsSync(myPath)) {
      console.debug("Found my path!");
      return Promise.resolve(myPath);
    }

    throw new Error('Directory not found!');
  } catch (err) {
    console.debug("Trying by app id...");
    return util.GameStoreHelper.findByAppId([GOGAPP_ID])
      .then(game => game.gamePath);
  }
}

async function prepareForModding(discovery, api) {
  const modPath = path.join(discovery.path, 'mods')

  await fs.ensureDirWritableAsync(modPath);
  await fs.ensureDirWritableAsync(path.join(modPath, 'Engine'));
}

module.exports = {
  default: main
};