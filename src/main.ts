const { default: mongoose } = require("mongoose");

const run = async () => {
    const connection = await mongoose.connect("mongodb://127.0.0.1:27017", {
        dbName: "packages",
    });
    // console.log("connection", connection);

    await mongoose.disconnect();
};

run();
