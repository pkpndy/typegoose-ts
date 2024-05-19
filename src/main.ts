const { default: mongoose } = require("mongoose");
const readline = require('readline');
const util = require('util');
import PackageModel from './models/package.model';
import FlagsModel, { FlagsClass } from './models/flags.model';
import { Ref } from '@typegoose/typegoose';

interface PackageDetails {
    packageName: string;
    flagsAssociated?: string[];
}

interface FlagDetails {
    flagName: string;
    summary: string;
    flagValue: string | number;
    packagesAssociated?: string[];
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

    const packageDetails = {
        packageName: "NewPackage11"
    };

    // const newPackage = await createPackage(packageDetails);

    // await getAllPackages();

    const flagDetails = {
        flagName: "newwwwwwwFlagg",
        summary: "hey giys this is my new flag",
        flagValue: 0,
        packagesAssociated: ["6649e4e9f6bbf596b10788eb"],
    }

    // await createFlag(flagDetails);

    // await getPackaDetailsByPackageName("NewPackage11");

    // const flagIDS = await getFlagIDsFromFlagNames(["flag1", "flag2"]);
    // console.log("flag ids", flagIDS);

    // await getAllFlags();

    // await deletePackage("firstPackage");

    // await deleteFlag("newwwwwwwFlagg");

    await deletePackage("NewPackage11");

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
        { $addToSet: { packagesAssociated: newPackage._id.toString() } }
    ).exec();

    console.log("Package created with flags:", newPackage);
}

const createFlag = async (flagDetails: FlagDetails) => {
    const newFlag = new FlagsModel({
        flagName: flagDetails.flagName,
        summary: flagDetails.summary,
        flagValue: flagDetails.flagValue,
        packagesAssociated: flagDetails.packagesAssociated
    });
    await newFlag.save();

    await PackageModel.updateMany(
        { _id: { $in: flagDetails.packagesAssociated } },
        { $addToSet: { flagsAssociated: newFlag._id } }
    ).exec();

    console.log(`Flag created:\n ${newFlag.flagName} `);
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

const getFlagDetailsByFlagName = async (flagName: string) => {
    const flag = await FlagsModel.find({ flagName }).exec();
    if (!flag || flag.length === 0) {
        console.log(`No flags with name ${flagName} found`);
    } else {
        console.log("flag: ", flag);
    }
}

const getAllFlags = async () => {
    const result = await FlagsModel.find().exec();
    if (!result) {
        console.log("flags not found");   
    }
    console.log(result);
}

const deleteFlag = async (flagName: string) => {
    const flagFound = await FlagsModel.find({ flagName }).exec();
    const flag = flagFound[0];
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
        { $pull: { flagsAssociated: flag._id } }
    ).exec();

    // Delete the flag
    await FlagsModel.findByIdAndDelete(flag._id).exec();

    console.log('Flag deleted successfully.');
};

const deletePackage = async (packageName: string) => {
    const packageFound = await PackageModel.find({ packageName }).exec();
    if (!packageFound) {
        console.log(`package ${packageName} not found`);
    }
    const packageDocument = packageFound[0];

    await FlagsModel.updateMany(
        { _id: { $in: packageDocument.flagsAssociated } },
        { $pull: { packagesAssociated: packageDocument._id } }
    ).exec();

    await PackageModel.findOneAndDelete({ packageName });

    console.log('package deleted successfully.');
}

run().catch((err) => { console.log("error aa gya: ", err); });
