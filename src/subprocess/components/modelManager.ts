import { IFormatter } from "../../interfaces";

export default class ModelManager {
    private formatter: IFormatter;

    constructor(formatter: IFormatter) {
        this.formatter = formatter;
    }
}
