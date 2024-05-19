import { Severity, getModelForClass, modelOptions, prop } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "flags" } })
export class FlagsClass {
    @prop({
        required: true,
        unique: true,
    })
    public flagName!: string;

    @prop({ required: true })
    public summary!: string;

    @prop({ required: true, default: 0 })
    public flagValue!: string | number;

    @prop({
        type: () => [String],
        set: (array: string[]) => Array.from(new Set(array))
     })
    public packagesAssociated?: string[];
}

const FlagsModel = getModelForClass(FlagsClass, {
    schemaOptions: {
        timestamps: true
    },
    options: {
        allowMixed: Severity.ALLOW
    }
});

export default FlagsModel;