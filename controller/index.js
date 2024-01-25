import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { promisify } from "util";
import gTTs from "gtts";
import { exec } from "child_process";
import StorageToken from "../model/index.js";

const controller = Object.create(null);
const unlinkAsync = promisify(fs.unlink);

controller.createStorage = async (req, res) => {
  try {
    //     check if cookies exist
    if (req.cookies?.token) {
      return res.status(400).json({
        status: "Bad Request",
        message: "Storage already exists",
      });
    }
    const token = uuidv4();

    res.cookie("token", token, {
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
      // httpOnly: true,
    });

    // save token to database
    const storageToken = new StorageToken({
      token: token,
    });
    await storageToken.save();

    return res.json({
      status: "ok",
      message: "Storage Created Successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "Internal Server Error",
      message: error.message,
    });
  }
};

controller.uploadFile = async (req, res) => {
  try {
    const token = req.storage.token;
    const storageToken = await StorageToken.findOne({ token });
    if (storageToken) {
      //     get the file from request body
      const file = req.file;
      if (file) {
        // check file mime type is txt , image, video, audio/*
        const fileMimeType = file.mimetype;
        if (
          !(
            fileMimeType.startsWith("text") ||
            fileMimeType.startsWith("image") ||
            fileMimeType.startsWith("video") ||
            fileMimeType.startsWith("audio")
          )
        ) {
          return res.json({
            status: "Bad Request",
            message: "File type not supported",
          });
        }

        // save file to public/upload folder with uuid as name
        const fileName = uuidv4() + "." + file.originalname.split(".").pop();

        const filePath = `public/upload/${fileName}`;

        fs.renameSync(file.path, filePath);
        // push the filepath to database
        storageToken.uploadedFiles.push(fileName);
        await storageToken.save();
        return res.json({
          status: "ok",
          message: "File uploaded successfully",
          file_path: filePath,
        });
      }
      return res.status(400).json({
        status: "Bad Request",
        message: "No file found",
      });
    }
  } catch (error) {
    console.error(error);
    return res.json({
      status: "Internal Server Error",
      message: error.message,
    });
  }
};

controller.getFile = async (req, res) => {
  try {
    const token = req.storage.token;
    const storageToken = await StorageToken.findOne({ token }).select(
      "uploadedFiles"
    );
    if (!storageToken) {
      return res.status(400).json({
        status: "Bad Request",
        message: "Storage not found",
      });
    }
    const fileName = req.params.file_name;
    //   check if file exists in database
    const file = storageToken.uploadedFiles.find((file) => file === fileName);

    if (!file) {
      return res.status(400).json({
        status: "Bad Request",
        message: "File not found",
      });
    }

    const filePath = `public/upload/${fileName}`;
    //   send file to client
    return res.sendFile(filePath, { root: "." });
  } catch (error) {
    console.error(error);
    return res.json({
      status: "Internal Server Error",
      message: error.message,
    });
  }
};

controller.getMyUploadFiles = async (req, res) => {
  try {
    const token = req.storage.token;
    const storageToken = await StorageToken.findOne({ token }).select(
      "uploadedFiles"
    );
    if (!storageToken) {
      return res.status(400).json({
        status: "Bad Request",
        message: "Storage not found",
      });
    }

    return res.json({
      status: "ok",
      data: storageToken.uploadedFiles,
    });
  } catch (error) {
    console.error(error);
    return res.json({
      status: "Internal Server Error",
      message: error.message,
    });
  }
};

controller.textFileToAudio = async (req, res) => {
  try {
    const { file_path } = req.body;
    const token = req.storage.token;

    if (!file_path) {
      return res.status(400).json({
        status: "Bad Request",
        message: "File path not found",
      });
    }
    const storageToken = await StorageToken.findOne({
      token,
    }).select("uploadedFiles");
    const fileName = file_path.split("/").pop();
    const fileExist = storageToken.uploadedFiles.find(
      (file) => file === fileName
    );

    if (!fileExist) {
      return res.status(400).json({
        status: "Bad Request",
        message: "File not found",
      });
    }
    const fileMimeType = file_path.split(".").pop();
    if (fileMimeType !== "txt") {
      return res.status(400).json({
        status: "Bad Request",
        message: "File is not a text file",
      });
    }
    // read text file
    const fileContent = fs.readFileSync(file_path, "utf-8");
    // filename to save audio file
    const audioFileName = uuidv4() + ".mp3";
    const audioFilePath = `public/upload/${audioFileName}`;
    // create audio file from text file
    const gtts = new gTTs(fileContent, "en");
    // save audio file and send to client
    gtts.save(audioFilePath, async (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          status: "Internal Server Error",
          message: err.message,
        });
      }
      //  save audio file to database
      storageToken.uploadedFiles.push(audioFileName);

      await storageToken.save();
      return res.json({
        status: "ok",
        message: "text to speech converted",
        audio_file_path: audioFilePath,
      });
    });
  } catch (error) {
    console.error(error);
    return res.json({
      status: "Internal Server Error",
      message: error.message,
    });
  }
};

controller.mergeImageAndAudio = async (req, res) => {
  try {
    const { image_file_path, audio_file_path } = req.body;
    const token = req.storage.token;

    if (!image_file_path || !audio_file_path) {
      return res.status(400).json({
        status: "Bad Request",
        message: "File path not found",
      });
    }

    const storageToken = await StorageToken.findOne({ token }).select(
      "uploadedFiles"
    );
    // get image file name and audio file name from file path
    // and check if file exists in database

    const imageFileName = image_file_path.split("/").pop();
    const audioFileName = audio_file_path.split("/").pop();
    const imageFileExist = storageToken.uploadedFiles.find(
      (file) => file === imageFileName
    );

    const audioFileExist = storageToken.uploadedFiles.find(
      (file) => file === audioFileName
    );

    if (!imageFileExist || !audioFileExist) {
      return res.status(400).json({
        status: "Bad Request",
        message: "File not found",
      });
    }
    //   check type of file if it is image or audio,
    //   this is because we are merging image and audio
    const imageFileMimeType = image_file_path.split(".").pop();
    const audioFileMimeType = audio_file_path.split(".").pop();

    if (imageFileMimeType !== "jpg" && imageFileMimeType !== "png") {
      return res.status(400).json({
        status: "Bad Request",
        message: "File is not an image file",
      });
    }

    if (audioFileMimeType !== "mp3" && audioFileMimeType !== "wav") {
      return res.status(400).json({
        status: "Bad Request",
        message: "File is not an audio file",
      });
    }

    //   create new file name for merged file
    const mergedFileName = uuidv4() + ".mp4";
    const mergedFilePath = `public/upload/${mergedFileName}`;
    //   merge image and audio
    // this command has been taken from internet 😅
    const command = `ffmpeg -loop 1 -i ${image_file_path} -i ${audio_file_path} -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest -y ${mergedFilePath}`;
    // -loop 1 -i ${image_file_path} - loop the image for 1 time
    // -i ${audio_file_path} - input audio file
    //   libx264 - video codec
    //   aac - audio codec
    //   yuv420p - pixel format
    // -shortest - shortest video length
    // -y ${mergedFilePath} - output file path

    exec(command, async (err, stdout, stderr) => {
      console.log("test");
      if (err) {
        console.error(err);
        return res.status(500).json({
          status: "Internal Server Error",
          message: err.message,
        });
      }
      //   save merged file to database
      storageToken.uploadedFiles.push(mergedFileName);
      await storageToken.save();
      return res.json({
        status: "ok",
        message: "Video Created Successfully",
        video_file_path: mergedFilePath,
      });
    });
  } catch (error) {
    console.error(error);
    return res.json({
      status: "Internal Server Error",
      message: error.message,
    });
  }
};

controller.mergeVideoAndAudio = async (req, res) => {
  try {
    const { video_file_path, audio_file_path } = req.body;
    const token = req.storage.token;

    if (!video_file_path || !audio_file_path) {
      return res.status(400).json({
        status: "Bad Request",
        message: "File path not found",
      });
    }

    const storageToken = await StorageToken.findOne({ token }).select(
      "uploadedFiles"
    );

    const videoFileName = video_file_path.split("/").pop();
    const audioFileName = audio_file_path.split("/").pop();

    const videoFileExist = storageToken.uploadedFiles.find(
      (file) => file === videoFileName
    );
    const audioFileExist = storageToken.uploadedFiles.find(
      (file) => file === audioFileName
    );

    if (!videoFileExist || !audioFileExist) {
      return res.status(400).json({
        status: "Bad Request",
        message: "File not found",
      });
    }

    const videoFileMimeType = video_file_path.split(".").pop();
    const audioFileMimeType = audio_file_path.split(".").pop();

    if (videoFileMimeType !== "mp4" && videoFileMimeType !== "mkv") {
      return res.status(400).json({
        status: "Bad Request",
        message: "File is not a video file",
      });
    }

    if (audioFileMimeType !== "mp3") {
      return res.status(400).json({
        status: "Bad Request",
        message: "File is not an audio file",
      });
    }

    const mergedFileName = uuidv4() + ".mp4";
    const mergedFilePath = `public/upload/${mergedFileName}`;

    const command = `ffmpeg -i ${video_file_path} -i ${audio_file_path} -c copy -map 0:v:0 -map 1:a:0 -shortest -y ${mergedFilePath}`;
    exec(command, async (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          status: "Internal Server Error",
          message: err.message,
        });
      }
      console.log(stdout);
      storageToken.uploadedFiles.push(mergedFileName);
      await storageToken.save();
      return res.json({
        status: "ok",
        message: "Video and Audio Merged Successfully",
        video_file_path: mergedFilePath,
      });
    });
  } catch (error) {
    console.error(error);
    return res.json({
      status: "Internal Server Error",
      message: error.message,
    });
  }
};

controller.mergeAllVideo = async (req, res) => {
  try {
    const { video_file_path_list } = req.body;
    const token = req.storage.token;
    if (!video_file_path_list?.length) {
      return res.status(400).json({
        status: "Bad Request",
        message: "File path not found",
      });
    }

    const storageToken = await StorageToken.findOne({ token }).select(
      "uploadedFiles"
    );

    const videoFileList = video_file_path_list.filter((video_file_path) => {
      const videoFileName = video_file_path.split("/").pop();

      const videoFileExist = storageToken.uploadedFiles.find(
        (file) => file === videoFileName
      );

      if (!videoFileExist) {
        return false;
      }
      const videoFileMimeType = video_file_path.split(".").pop();
      return videoFileMimeType === "mp4";
    });

    if (videoFileList.length < 1) {
      return res.status(400).json({
        status: "Bad Request",
        message: "File not found",
      });
    }

    const mergedFileName = uuidv4() + ".mp4";
    const mergedFilePath = `public/upload/${mergedFileName}`;

    //  create text file for video list with content like this
    // file 'video1.mp4'
    // file 'video2.mp4'

    const videoListFilePath = `public/upload/${uuidv4()}.txt`;
    const currentWorkingDirectory = process.cwd();
    const videoListFileContent = videoFileList
      .map(
        (video_file_path) =>
          `file '${currentWorkingDirectory + "/" + video_file_path}'`
      )
      .join("\n");

    fs.writeFileSync(videoListFilePath, videoListFileContent);

    const command = `ffmpeg -f concat -safe 0 -i ${videoListFilePath} -c copy -y ${mergedFilePath}`;

    exec(command, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          status: "Internal Server Error",
          message: err.message,
        });
      }
      storageToken.uploadedFiles.push(mergedFileName);
      await storageToken.save();
      // delete video list file
      fs.unlinkSync(videoListFilePath);

      return res.json({
        status: "ok",
        message: "Merged All Video Successfully",
        video_file_path: mergedFilePath,
      });
    });
  } catch (error) {
    console.error(error);
    return res.json({
      status: "Internal Server Error",
      message: error.message,
    });
  }
};

controller.downloadFile = async (req, res) => {
  try {
    const { file_path } = req.query;

    if (!file_path) {
      return res.status(400).json({
        status: "Bad Request",
        message: "File path not found",
      });
    }

    const token = req.storage.token;
    const storageToken = await StorageToken.findOne({ token }).select(
      "uploadedFiles"
    );
    const fileName = file_path.split("/").pop();
    const fileExist = storageToken.uploadedFiles.find(
      (file) => file === fileName
    );
    if (!fileExist) {
      return res.status(400).json({
        status: "Bad Request",
        message: "File not found",
      });
    }
    return res.download(file_path);
  } catch (error) {
    console.error(error);
    return res.json({
      status: "Internal Server Error",
      message: error.message,
    });
  }
};

export default controller;
