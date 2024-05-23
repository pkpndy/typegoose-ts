const { default: mongoose } = require("mongoose");
const readline = require('readline');
const util = require('util');
import PackageModel from './models/package.model';
import FlagsModel, { FlagsClass } from './models/flags.model';
import { Types } from 'mongoose';

interface PackageUpdateDetails {
    packageId: string;
    newName?: string;
    addFlags?: string[]; 
    removeFlags?: string[]; 
}

interface FlagUpdateDetails {
    flagId: string;
    newName?: string;
    newSummary?: string;
    newValue?: string | number;
    addPackages?: string[];
    removePackages?: string[];
}


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
        packageName: "NewPackage010",
        flagsAssociated: ["6649ef49a7f334b2d142d9c4"]
    };

    // const newPackage = await createPackage(packageDetails);

    // await getAllPackages();

    const flagDetails = {
        flagName: "newwwFlagg",
        summary: "hey giys this is flag",
        flagValue: 3,
    }

    // await createFlag(flagDetails);

    const packageUpdateDetails = {
        packageId: "664e9cb52fcf951361a99516",
        addFlags: ["664e20a07361894f91510268"],
        removeFlags: ["6649ef49a7f334b2d142d9c4"]
    }

    // exampleFunction("value1", param3: "value3", param4: "value4");
    // exampleFunction({ param1: "value1", param3: "value3", param4: "value4" });
    // await editPackage(packageUpdateDetails);

    // await editFlag({ flagId : "6649ef49a7f334b2d142d9c4", newSummary: "lol rcb just got eliminated", addPackages: ["664e9cb52fcf951361a99516"], removePackages: ["664e23d196da3acbb0613e03"] });

    // await getPackaDetailsByPackageName("NewPackage11");

    // const flagIDS = await getFlagIDsFromFlagNames(["flag1", "flag2"]);
    // console.log("flag ids", flagIDS);

    // await getAllFlags();

    // await deletePackage("firstPackage");

    // await deleteFlag("newwwwwwwFlagg");

    // await deletePackage("NewPackage11");

    await mongoose.disconnect();
};

const editPackage = async ({ packageId, newName, addFlags = [], removeFlags = [] }: PackageUpdateDetails) => {
    const packageDoc = await PackageModel.findById(packageId).exec();

    if (packageDoc) {
         // Update the package name if provided
        if (newName) {
            packageDoc.packageName = newName;
        }

        // Remove specified flags from the package
        if (removeFlags.length > 0 && packageDoc.flagsAssociated !== undefined) {
            packageDoc.flagsAssociated = packageDoc.flagsAssociated.filter(flag => !removeFlags.includes(flag.toString()));
            // Remove the package reference from the removed flags
            await FlagsModel.updateMany(
                { _id: { $in: removeFlags } },
                { $pull: { packagesAssociated: packageDoc._id.toString() } }
            ).exec();
        }

        // Add specified flags to the package
        if (addFlags.length > 0 && packageDoc.flagsAssociated !== undefined) {
            packageDoc.flagsAssociated.push(...addFlags.map(id => new Types.ObjectId(id)));
        // Add the package reference to the added flags
        await FlagsModel.updateMany(
            { _id: { $in: addFlags.map(id => new Types.ObjectId(id)) } }, // Convert IDs to ObjectIds
            { $addToSet: { packagesAssociated: packageDoc._id.toString() } }
        ).exec();
        }

        // Save the updated package document
        await packageDoc.save();

        console.log('Package updated successfully.');        
    }
    else {
        console.log('Package not found.');
        return;
    }

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

const editFlag = async ({ flagId, newName, newSummary, newValue, addPackages = [], removePackages = [] }: FlagUpdateDetails) => {
    const flagDoc = await FlagsModel.findById(flagId).exec();

    if (!flagDoc) {
        console.log('Flag not found.');
        return;
    }

    // Update the flag name if provided
    if (newName) {
        flagDoc.flagName = newName;
    }

    // Update the flag summary if provided
    if (newSummary) {
        flagDoc.summary = newSummary;
    }

    // Update the flag value if provided
    if (newValue !== undefined) {
        flagDoc.flagValue = newValue;
    }

    // Remove specified packages from the flag
    if (removePackages.length > 0 && flagDoc.packagesAssociated != undefined) {
        flagDoc.packagesAssociated = flagDoc.packagesAssociated.filter(pkg => !removePackages.includes(pkg.toString()));
        // Remove the flag reference from the removed packages
        await PackageModel.updateMany(
            { _id: { $in: removePackages } },
            { $pull: { flagsAssociated: flagDoc._id.toString() } }
        ).exec();
    }

    // Add specified packages to the flag
    if (addPackages.length > 0 && flagDoc.packagesAssociated != undefined) {
        flagDoc.packagesAssociated.push(...addPackages.filter(pkg => !flagDoc.packagesAssociated!.includes(pkg as any)));
        // Add the flag reference to the added packages
        await PackageModel.updateMany(
            { _id: { $in: addPackages } },
            { $addToSet: { flagsAssociated: flagDoc._id.toString() } }
        ).exec();
    }

    // Save the updated flag document
    await flagDoc.save();

    console.log('Flag updated successfully.');
};


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
