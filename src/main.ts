const { default: mongoose } = require("mongoose");
import PackageModel from './models/package.model';
import FlagsModel, {FlagsClass} from './models/flags.model';

const run = async () => {
    const connection = await mongoose.connect("mongodb://127.0.0.1:27017", {
        dbName: "packages",
    });
    // console.log("connection", connection);
    await createPackages();

    await mongoose.disconnect();
};

const createPackages = async () => {
    const flag1 = new FlagsModel({
        flagName: "flag1",
        summary: "flag 1 summary",
        flagValue: 2,
        totalPackages: 4,
        packagesAssociated: []
    });

    const flag2 = new FlagsModel({
        flagName: "flag2",
        summary: "flag 2 summary",
        flagValue: 5,
        totalPackages: 10
    });

    await flag1.save();
    await flag2.save();

    const newPackage = new PackageModel({
        packageName: "firstPackage",
        flagsAssociated: [flag1._id, flag2._id]
    });

    await newPackage.save();

    flag1.packagesAssociated?.push(newPackage._id.toString());

    await flag1.save();

    console.log("Package created with flags:", newPackage);
    console.log("flag1 : ", flag1);
}

run().catch((err) => { console.log("error aa gya: ", err); });
