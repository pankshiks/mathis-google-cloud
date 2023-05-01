const functions = require("firebase-functions");
const express = require("express");
const app = express();

const bucketName = "penbox";

const { Storage } = require("@google-cloud/storage");

function uploadFile(base64Data) {
  base64EncodedImageString = base64Data.file.replace(
    /^data:image\/\w+;base64,/,
    ""
  );
  const imageType = base64Data.file_type.split("/");
  // Convert base64 to binary data
  const binaryData = Buffer.from(base64EncodedImageString, "base64");
  // Create a new Storage client
  const storage = new Storage({
    projectId: "dossiers-emprunteurs",
  });
  // Get a reference to your bucket
  const bucket = storage.bucket(bucketName);
  // Define the name of the file to be uploaded to your bucket
  let rawFileName = base64Data.file_name.toLowerCase();

  if (rawFileName.includes("-")) {
    rawFileName = rawFileName.split("-");
    let fileName1 = rawFileName[rawFileName.length - 1].split(".");
    fileName1 = fileName1[0].replaceAll(" ", "");
    // console.log({ fileName1: fileName1 });
    var newFileName = fileName1;
  } else {
    rawFileName = rawFileName.split(".");
    let fileName1 = rawFileName[rawFileName.length - 2].replaceAll(" ", "");
    var newFileName = fileName1;
  }

  const finalFileName = `${base64Data.first_name}.${base64Data.last_name}.${newFileName}`;

  // console.log({ fileName: finalFileName });
  const filename = finalFileName;
  // Create a write stream to upload the file to your bucket
  const remoteFile = bucket.file(`${base64Data.folder_name}/` + filename);
  const writeStream = remoteFile.createWriteStream({
    metadata: {
      contentType: base64Data.file_type,
    },
  });
  // Write the binary data to the write stream
  writeStream.write(binaryData);
  // End the write stream and wait for the upload to complete

  writeStream.end(() => {
    console.log(`File uploaded to ${filename}.`);
  });
  return true;
}

async function getFolderNames() {
  try {
    // Create a new instance of the Google Cloud Storage client
    const storage = new Storage({
      projectId: "dossiers-emprunteurs",
    });
    // Get a reference to the specified bucket
    const bucket = storage.bucket("penbox");
    // Use the `getFiles()` method to fetch a list of all objects in the bucket
    const [files] = await bucket.getFiles();

    // Create an array to store folder names
    const folders = [];
    // Loop through all the objects and extract folder names
    files.forEach((file) => {
      const folderName = file.name.split("/")[0];
      if (!folders.includes(folderName)) {
        folders.push(folderName);
      }
    });
    return { folderName: folders };
  } catch (err) {
    console.error(err);
    return { err: err };
  }
}

app.post("/upload", async (req, res) => {
  const image = req.body;
  const result = await uploadFile(image);
  if (result) {
    res.send("Success");
  } else {
    res.send("Failed to upload");
  }
});

app.post("/filter", async (req, res) => {
  try {
    const folderName = req.body.name;
    const names = await getFolderNames();
    const _res =
      names.folderName.length > 0 &&
      names.folderName.filter((item) => item == folderName);
    res.send({
      Folder_exist: _res,
    });
  } catch (error) {
    res.send({
      error: error,
    });
  }
});

exports.bucket_cloud = functions.https.onRequest(app);
