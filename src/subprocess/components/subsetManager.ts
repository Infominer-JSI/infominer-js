import { IFormatter } from "../../interfaces";

export default class SubsetManager {
    private formatter: IFormatter;

    constructor(formatter: IFormatter) {
        this.formatter = formatter;
    }
}
