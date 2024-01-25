### Introduction 👋
This is an Express.js application that allows users to upload images, videos, text, audio.
Main features:
- merge image and audio
- merge audio and video
- text to speech
- merge videos


The application is built using the following technologies:
- Node.js
- Express.js
- MongoDB
- Mongoose
- Multer
- FFmpeg
- gtts

---
### Installation
#### Prerequisites:
- Node.js
  - https://nodejs.org/en/download/
- MongoDB
  - https://docs.mongodb.com/manual/installation/
- FFmpeg
  - https://www.ffmpeg.org/download.html
---
#### Steps:
- Clone the repository
- Install dependencies using `yarn install`
- Start the application using `yarn start` or `yarn dev` for development
- Navigate to `localhost:8001` in your browser

---
### Usage
#### Endpoints
- `POST /create_new_storage` - Create new storage for user
  <br/><br/>
- `POST /upload_file` - Upload file to storage 
  - Request body:
    - `my_file` - file to upload
  - Response body:
    - `status` - status of the request
    - `data` - array of uploaded files 
    <br/><br/>
- `GET /my_upload_file` - uploaded file 
  - Response body:
    - `status` - status of the request
    - `message` - message of the request
    - `file_path` - path to the file<br/><br/>
- `GET /public/upload/:file_name` - view uploaded file
  - Response body:
    - stream of the file <br/><br/>
- `POST /merge_image_and_audio` - merge image and audio
  - Request body:
    - `image_file_path` - image to merge
    - `audio_file_path` - audio to merge
  - Response body:
    - `status` - status of the request
    - `message` - message of the request
    - `video_file_path` - path to the file
  - Example:
    - `image_file_path` - `public/upload/1626170001.png`
    - `audio_file_path` - `public/upload/1626170002.mp3`
  - Result:
    - `video_file_path` - `public/upload/1626170003.mp4`
    - `status` - `ok`
    - `message` - `Video Created Successfully`<br/><br/>
- `POST /text_file_to_audio` - text to speech
  - Request body:
    - `file_path` - text to speech
  - Response body:
    - `status` - status of the request
    - `message` - message of the request
    - `audio_file_path` - path to the file
  - Example:
    - `file_path` - `public/upload/1626170004.txt`
  - Result:
    - `audio_file_path` - `public/upload/1626170005.mp3`
    - `status` - `ok`
    - `message` - `Text to speech converted`<br/><br/>
- `POST /merge_video_and_audio` - merge video and audio
  - Request body:
    - `video_file_path` - video to merge
    - `audio_file_path` - audio to merge
  - Response body:
    - `status` - status of the request
    - `message` - message of the request
    - `video_file_path` - path to the file
  - Example:
    - `video_file_path` - `public/upload/1626170006.mp4`
    - `audio_file_path` - `public/upload/1626170007.mp3`
  - Result:
    - `video_file_path` - `public/upload/1626170008.mp4`
    - `status` - `ok`
    - `message` - `Video and Audio Merged Successfully`<br/><br/>
- `POST /merge_all_video` - merge all video
  - Request body:
    - `video_file_path_list` - array of video to merge
  - Response body:
    - `status` - status of the request
    - `message` - message of the request
    - `video_file_path` - path to the file
  - Example:
    - `video_file_path_list` - `["public/upload/1626170009.mp4","public/upload/1626170010.mp4","public/upload/1626170011.mp4"]`
  - Result:
    - `video_file_path` - `public/upload/1626170012.mp4`
    - `status` - `ok`
    - `message` - `Merged All Video Successfully`<br/><br/>
- `GET /download_file` - Download file
  - Required query params:
    - `file_path` - path to the file
  - Response:
    - Download file
  - Example:
    - `localhost:8001/download_file?file_path=public/upload/1626170012.mp4`
  - Result:
    - Download file

