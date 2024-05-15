import { Ref, Severity, getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { FlagsClass } from "./flags.model";

@modelOptions({ schemaOptions: { collection: "packages" } }) //this will set the name for our collection
export class PackagesClass {
    @prop({
        required: true,
        unique: true,
    })
    public packageName!: string;

    @prop({ ref: () => FlagsClass })
    public flagsAssociated?: Ref<FlagsClass>[];
}

const PackageModel = getModelForClass(PackagesClass, {
    schemaOptions: {
        timestamps: true
    },
    options: {
        allowMixed: Severity.ALLOW
    }
});

export default PackageModel;