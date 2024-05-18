const { default: mongoose } = require("mongoose");
const readline = require('readline');
const util = require('util');
import PackageModel from './models/package.model';
import FlagsModel, { FlagsClass } from './models/flags.model';

interface PackageDetails {
    packageName: string;
    flagsAssociated: string[];
}

const askQuestion = (query: string): Promise<string> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(query, (answer: any) => {
            rl.close();
            resolve(answer);
        });
    });
};

const run = async () => {
    const connection = await mongoose.connect("mongodb://127.0.0.1:27017", {
        dbName: "packages",
    });

    // const packageDetails = {
    //     packageName: "NewPackage11",
    //     flagsAssociated: ["6644531c49f8fcd9e5941491", "6644531c49f8fcd9e5941492"],
    // };

    // const newPackage = await createPackage(packageDetails);

    // await getAllPackages();

    // await getPackaDetailsByPackageName("NewPackage11");

    // const flagIDS = await getFlagIDsFromFlagNames(["flag1", "flag2"]);
    // console.log("flag ids", flagIDS);

    await getAllFlags();

    await mongoose.disconnect();
};

const createPackage = async (packageDetails: PackageDetails) => {
    const newPackage = new PackageModel({
        packageName: packageDetails.packageName,
        flagsAssociated: packageDetails.flagsAssociated,
    });
    await newPackage.save();

    // Update the packagesAssociated array of the specified flags
    await FlagsModel.updateMany(
        { _id: { $in: packageDetails.flagsAssociated } },
        { $push: { packagesAssociated: newPackage._id.toString() } }
    ).exec();

    console.log("Package created with flags:", newPackage);
}

const getAllPackages = async () => {
    const res = await PackageModel.find().populate('flagsAssociated').exec();
    if (!res || res.length === 0) {
        console.log("No packages found");
    } else {
        console.log(util.inspect(res, { showHidden: false, depth: null, colors: true }));
    }
};

const getPackaDetailsByPackageName = async (packageName: String) => {
    const res = await PackageModel.find({ packageName }).populate('flagsAssociated').exec();  
    if (!res || res.length === 0) {
        console.log(`No packages with name ${packageName} found`);
    } else {
        console.log(util.inspect(res, { showHidden: false, depth: null, colors: true }));
    }
}

const getFlagIDsFromFlagNames = async (flagNames: string[]): Promise<string[]> => {
    const flags = await FlagsModel.find({ flagName: { $in: flagNames } }, { _id: 1 });

    // Extract and return the IDs of the flags
    const flagIDs = flags.map(flag => flag._id.toString());
    return flagIDs;
}

const getAllFlags = async () => {
    const result = await FlagsModel.find().exec();
    if (!result) {
        console.log("flags not found");   
    }
    console.log(result);
}

const deleteFlag = async (flagId: string) => {
    // Find the flag by its ID
    const flag = await FlagsModel.findById(flagId).exec();
    if (!flag) {
        console.log('Flag not found.');
        return;
    }

    // Check if the flag has associated packages
    if (flag.packagesAssociated && flag.packagesAssociated.length > 0) {
        // Retrieve the names of the associated packages
        const packages = await PackageModel.find({
            _id: { $in: flag.packagesAssociated }
        }).exec();
        const packageNames = packages.map(pkg => pkg.packageName);

        console.log('The flag is associated with the following packages:');
        console.log(packageNames.join(', '));

        // Ask for user confirmation
        const answer = await askQuestion('Do you still want to delete the flag? (yes/no): ');

        if (answer.toLowerCase() !== 'yes') {
            console.log('Deletion cancelled.');
            return;
        }
    }

    // Remove the flag reference from associated packages
    await PackageModel.updateMany(
        { _id: { $in: flag.packagesAssociated } },
        { $pull: { flagsAssociated: flagId } }
    ).exec();

    // Delete the flag
    await FlagsModel.findByIdAndDelete(flagId).exec();


    console.log('Flag deleted successfully.');
}

run().catch((err) => { console.log("error aa gya: ", err); });
