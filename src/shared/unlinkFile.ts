import fs from "fs";

const unlinkFile = (path?: string) => {
  if (path && fs.existsSync(path)) {
    try {
      fs.unlinkSync(path);
    } catch {
      // ignore unlink errors
    }
  }
};

export default unlinkFile;
