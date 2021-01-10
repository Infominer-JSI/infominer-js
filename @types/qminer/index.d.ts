/** The QMiner Module */
declare module "qminer" {
    /** Represents the database and holds stores */
    export class Base {
        /**
         * Creates a base
         * @param params - The constructor parameters.
         */
        constructor(params: BaseParams);
        /** Closes the base and stores the data within */
        close(): null;
        createStore(storeDef: any, storeSizeInMB?: number = 1024): Store | Store[];
        garbageCollect(max_time?: number = -1): void;
        getStats(): any;
        getStoreList(): IStoreInfo[];
        getStreamAggr(saName: string): StreamAggr;
        getStreamAggrNames(): string[];
        isClosed(): boolean;
        isStore(name: string): boolean;
        loadCSV(opts: any, callback?: any): void;
        partialFlush(window?: number = 500): number;
        search(query: any): RecordSet;
        store(name: string): Store;
    }

    export class Store {
        length: number;
        name: string;
        base: Base;
        allRecords: RecordSet;
        first: Record;
        last: Record;
        empty: boolean;
        fields: IField[];
        joins: IJoin[];
        keys: IKey[];
        forwardIter: Iterator;
        backwardIter: Iterator;
        addStreamAggr(arg: any): void;
        addTrigger(trigger: any): void;
        cell(recId: number, fieldName: string): number | string | number[] | string[];
        clear(num?: number): number;
        each(callback: any): Store;
        field(fieldName: string): IField;
        getMatrix(fieldName: string): la.Matrix | la.SparseMatrix;
        getStreamAggrNames(): string[];
        getVector(fieldName: string): la.Vector;
        inspect(depth: number): string;
        isDate(fieldName: string): boolean;
        isNumeric(fieldName: string): boolean;
        isString(fieldName: string): boolean;
        key(keyName: string): IKey;
        loadJson(file: string, limit?): number;
        map(callback: any): any[];
        newRecord(obj: any): Record;
        newRecordSet(idVec: la.IntVector): RecordSet;
        push(rec: { [key: string]: any }, triggerEvents?: boolean = true): number;
        recordByName(recName: string): Record | null;
        resetStreamAggreates(): void;
        sample(sampleSize: number): RecordSet;
        toJson(): { [key: any]: any };
        triggerOnAddCallbacks(arg?: Record | number): void;
        [id: number]: Record | null;
    }

    export class RecordSet {
        empty: boolean;
        length: number;
        store: Store;
        weighted: boolean;
        aggr(params: any): { [key: any]: any };
        clone(): RecordSet;
        deleteRecords(rs: RecordSet): RecordSet;
        each(callback: (rec: qm.Record) => void): RecordSet;
        filter(callback: any): RecordSet;
        filterByField(
            fieldName: string,
            minVal: string | number | boolean,
            maxVal?: number
        ): RecordSet;
        filterByFq(minFq?: number, maxFq?: number): RecordSet;
        filterById(minId?: number, maxId?: number): RecordSet;
        getMatrix(fieldName: string): la.Matrix | la.SparseMatrix;
        getVector(fieldName: string): la.Vector;
        join(joinName: string, sampleSize?: number): RecordSet;
        map(callback: any): any[];
        reverse(): RecordSet;
        sample(num: number): RecordSet;
        setDiff(rs: RecordSet): RecordSet;
        setIntersect(rs: RecordSet): RecordSet;
        setUnion(rs: RecordSet): RecordSet;
        shuffle(seed?: number): RecordSet;
        sort(callback: any): RecordSet;
        sortByField(fieldName: string, asc?: number = -1): RecordSet;
        sortByFq(asc?: number = 1): RecordSet;
        sortById(asc?: number = -1): RecordSet;
        split(callback: number): RecordSet[];
        toJSON(): { [key: any]: any };
        trunc(limit_num: number, offset_num?: number): RecordSet;
        [id: number]: Record | null;
    }

    export class Record {
        $fq: number;
        $id: number;
        $name: number;
        store: Store;
        $addJoin(joinName: string, joinRecord: Record | number, joinFrequency?: number = 1): Record;
        $delJoin(joinName: string, joinRecord: Record | number, joinFrequency?: number = 1): Record;
        $clone(): Record;
        toJSON(
            joinRecords?: boolean = false,
            joinRecordFields?: boolean = false,
            sysFields?: boolean = true
        ): { [key: string]: any };
        [key: string]: any;
    }

    export class RecordVector {
        length: number;
        constructor(base: Base, fin?: fs.FIn);
        push(rec: Record): number;
        save(fout: fs.FOut): fs.FOut;
    }

    /** The Feature Space */
    export class FeatureSpace {
        /** The dimension of the feature space */
        dim: number;
        /**
         * The array of dimensions of each feature
         * extractor in the feature space
         */
        dims: number[];
        /**
         * Creates a new instance of a Feature Space.
         * @param base - The base where the features are extracted from.
         * @param args - The contruction arguments.
         */
        constructor(base: Base, args: IFeatureExtractor[] | fs.FIn);
        /**
         * Adds a new feature extractor to the feature space.
         * @param ftExt - The feature extractor.
         * @returns Self.
         */
        addFeatureExtractor(ftExt: IFeatureExtractor): FeatureSpace;
        /**
         * Updates the feature space values by processing the given record.
         * @param rec - The record using to update the feature space.
         * @returns Self. The feature space is updated.
         */
        updateRecord(rec: Record): FeatureSpace;
        /**
         * Updates the feature space values by processing the given record set.
         * @param rec - The record set using to update the feature space.
         * @returns Self. The feature space is updated.
         */
        updateRecords(rs: RecordSet): FeatureSpace;
        /**
         * Extract the dense feature vectors and returns them as columns of a dense matrix.
         * @param rs - The record set.
         * @param idx - When present, only use the specific feature extractor.
         * @returns The dense matrix containing the feature vectors as columns.
         */
        extractMatrix(rs: RecordSet, idx?: number): la.Matrix;
        /**
         * Extract the sparse feature vectors and returns them as columns of a sparse matrix.
         * @param rs - The record set.
         * @param idx - When present, only use the specific feature extractor.
         * @returns The sparse matrix containing the feature vectors as columns.
         */
        extractSparseMatrix(rs: RecordSet, idx?: number): la.SparseMatrix;
        /**
         * Extract the dense feature vector.
         * @param rec - The record.
         * @param idx - When present, only use the specific feature extractor.
         * @returns The dense vector.
         */
        extractVector(rec: Record, idx?: number): la.Vector;
        /**
         * Extract the sparse feature vector.
         * @param rec - The record.
         * @param idx - When present, only use the specific feature extractor.
         * @returns The sparse vector.
         */
        extractSparseVector(rec: Record, idx?: number): la.SparseVector;
        /**
         * Gets the name of the feature.
         * @param idx - The index of the feature.
         * @returns The name of the feature.
         */
        getFeature(idx: number): string;
        /**
         * Gets the name of the feature extractor.
         * @param idx - The index of the feature extractor.
         * @returns the name of the feature extractor.
         */
        getFeatureExtractor(idx: number): string;
        /**
         * Calculates the inverse of the value using a specific feature extractor.
         * @param idx - The index of the feature extractor.
         * @param val - The value to be inverted.
         * @returns The inverse of the value.
         */
        invertFeature(idx: number, val: number | string): number | string;
        /**
         * Inverts the feature vector. Works only for numeric feature extractors.
         * @param ftr - The feature values.
         * @returns The inverse of the feature vector.
         */
        invertFeatureVector(ftr: la.Vector | number[]): number[];
        /**
         * Filters the vector, keeping only the elements from the feature extractor.
         * @param vec - The vector from where the function filters the elements.
         * @param idx - The index of the feature extractor.
         * @param keepOffset - For keepeing the original indexing in the new vector.
         * @return The filtered vector.
         */
        filter(
            vec: la.Vector | la.SparseVector,
            idx: number,
            keepOffset?: boolean = true
        ): la.Vector | la.SparseVector;
        /**
         * Clears the feature space.
         * @returns Self. All feature extractors were removed.
         */
        clear(): FeatureSpace;
        /**
         * Serializes the feature space to an Output File Stream.
         * @param fout - The output file stream.
         * @returns The output file stream.
         */
        save(fout: fs.FOut): fs.FOut;
    }

    export class StreamAggr {
        init: boolean;
        name: string;
        val: { [key: any]: any };
        constructor(base: Base, arg: any, storeName?: string | string[]);
        getFeatureSpace(): FeatureSpace;
        getFloat(str?: string): number | null;
        getFloatAt(idx: number): number;
        getFloatLength(): number;
        getFloatVector(): la.Vector;
        getInFloatVector(): la.Vector;
        getInteger(str?: string): number | null;
        getInTimestampVector(): la.Vector;
        getInValueVector(): la.Vector | la.SparseMatrix;
        getNumberOfRecords(): number;
        getOutFloatVector(): la.Vector;
        getOutTimestampVector(): la.Vector;
        getOutValueVector(): la.Vector | la.SparseMatrix;
        getParams(): { [key: any]: any };
        getTimestamp(): number;
        getTimestampAt(idx: number): number;
        getTimestampLength(): number;
        getTimestampVector(): la.Vector;
        getValueVector(): la.Vector | la.SparseMatrix;
        load(fin: fs.FIn): StreamAggr;
        loadStateJson(state: any): StreamAggr;
        onAdd(rec: Record, caller?: StreamAggr): StreamAggr;
        onDelete(rec: Record, caller?: StreamAggr): StreamAggr;
        onStep(caller?: StreamAggr): StreamAggr;
        onTime(ts: number, caller?: StreamAggr): StreamAggr;
        onUpdate(rec: Record, caller?: StreamAggr): StreamAggr;
        reset(): StreamAggr;
        save(fout: fs.FOut): fs.FOut;
        saveJson(limit?: number): { [key: any]: any };
        saveStateJson(): { [key: any]: any };
        setParams(params: { [key: any]: any }): void;
    }

    /** The Store Iterator */
    class Iterator {
        /** The current record. */
        record: Record;
        /** The store being iterated. */
        store: Store;
        /**
         * Moves to the next record.
         * @returns True, if the iterator moved to the next record.
         * False, if there are no records left.
         */
        next(): boolean;
    }

    /**
     * Circular Record Buffer
     * Circular buffer for storing records. Size of buffer is defined at start
     * and is denoted in number of records. When buffer is full, old records are
     * removed from the buffer and new records are stored in their place. For
     * adding and deleting a callback is called. Records are stored by their IDs.
     */
    export class CircularRecordBuffer {
        /**
         * Creates a new instance of Cicular Record Buffer.
         * @param params - The constructor parameters.
         */
        constructor(params?: { store: Store; size: number; onAdd?: any; onDelete?: any });
        /**
         * Loads the circular buffer from the Input File Stream.
         * Assumes store, onAdd and onDelete were already initialized in constructor.
         * @param fin - The input file stream.
         * @returns Self. The circular record buffer is updated.
         */
        load(fin: fs.FIn): CircularRecordBuffer;
        /**
         * Adds a new record to the buffer.
         * @param rec - The record.
         * @returns Self.
         */
        push(rec: Record): CircularRecordBuffer;
        /**
         * Saves the circular record buffer. Does not save store, onAdd and onDelete.
         * @param fout - The output file stream.
         * @returns The output file stream.
         */
        save(fout: fs.FOut): fs.FOut;
    }

    /////////////////////////////////////////////
    // Linear algebra namespace
    /////////////////////////////////////////////

    /** Linear Algebra Module */
    export namespace la {
        export function cat(args: la.Matrix[][]): la.Matrix;
        export function conjgrad(
            A: la.Matrix | la.SparseMatrix,
            b: la.Vector,
            x?: la.Vector,
            verbose?: boolean
        ): la.Vector;
        export function copyVecToArray(vec: la.Vector): number[];
        export function eye(dim: number): la.Matrix;
        export function findMaxIdx(mat: la.Matrix | la.SparseMatrix): number[];
        export function inverseSVD(mat: la.Matrix): la.Matrix;
        export function ones(dim: number): la.Vector;
        export function pdist2(X1: la.Matrix, X2: la.Matrix): la.Matrix;
        export function randi(num: number, len?: number): number | la.IntVector;
        export function randn(arg1?: number, arg2?: number): number | la.Vector | la.matrix;
        export function randPerm(k: number): number[];
        export function randVariation(n: number, k: number): number[];
        export function rangeVec(min: number, max: number): la.IntVector;
        export function sparse(rows: number, cols?: number): la.SparseMatrix;
        export function speye(dim: number): la.SparseMatrix;
        export function square(x: number | la.Vector): number | la.Vector;
        export function zeros(rows: number, cols?: number): la.Matrix;
        export function qr(mat: la.Matrix, tol?: number): { Q: la.Matrix; R: la.Matrix };
        export function svd(
            mat: la.Matrix | la.SparseMatrix,
            k: number,
            json?: { iter?: number; tol?: number },
            callback: any
        ): { U: la.Matrix; V: la.Matrix; s: la.Vector };

        /** The dense matrix (2d arrays) */
        export class Matrix {
            /** Number of columns. */
            cols: number;
            /** Number of rows. */
            rows: number;
            /**
             * Creates a new instance of the Matrix.
             * @param args - The input arguments.
             */
            constructor(
                args?: { rows: number; cols: number; random?: boolean } | number[][] | la.Matrix
            ): la.Matrix;
            /**
             * Gets the matrix element at the position.
             * @param rowIdx - The row index.
             * @param colIdx - The column index.
             * @returns The matrix element.
             */
            at(rowIdx: number, colIdx: number): number;
            /**
             * Gets the index of the maximum element in the column.
             * @param colIdx - The column index.
             * @returns The index of the maximum element.
             */
            colMaxIdx(colIdx: number): number;
            /**
             * Calculates the matrix column norms.
             * @returns The dense vector containing the norms.
             */
            colNorms(): la.Vector;
            /**
             * Get the diagonal elements of the matrix.
             * @returns The diagonal elements in a dense vector.
             */
            diag(): la.Vector;
            /**
             * Calculates the Frobenious norm of the matrix.
             * @returns The Frobenious norm.
             */
            frob(): number;
            /**
             * Get a column of the matrix.
             * @param colIdx - The column index.
             * @returns the column as a dense vector.
             */
            getCol(colIdx: number): la.Vector;
            /**
             * Get a row of the matrix.
             * @param rowIdx - The row index.
             * @returns the row as a dense vector.
             */
            getRow(rowIdx: number): la.Vector;
            /**
             * Gets the submatrix containing some of the columns.
             * @param intVec - The vector containing the column indices.
             * @returns The submatrix containing the associated columns.
             */
            getColSubmatrix(intVec: la.IntVector): la.Matrix;
            /**
             * Gets the submatrix.
             * @param minRow - The minimum row index.
             * @param maxRow - The maximum row index.
             * @param minCol - The minimum column index.
             * @param maxCol - The maximum column index.
             * @returns The submatrix.
             */
            getSubmatrix(minRow: number, maxRow: number, minCol: number, maxCol: number): la.Matrix;
            /**
             * Loads the matrix from the input file stream.
             * @param fin - The input file stream.
             * @returns Self. If contains values stored in the input file stream.
             */
            load(fin: fs.FIn): la.Matrix;
            /**
             * Substracts two matrices.
             * @param mat - The other matrix.
             * @returns The difference of the matrices.
             */
            minus(mat: la.Matrix): la.Matrix;
            /**
             * Right-hand side multiplication of the matrix with the argument.
             * @param arg - The input argument.
             * @returns The multiplication result.
             */
            multiply(
                arg: number | la.Vector | la.SparseVector | la.Matrix | la.SparseMatrix
            ): la.Vector | la.Matrix;
            /**
             * Matrix transpose and right-hand side multiplication of the matrix with the argument.
             * @param arg - The input argument.
             * @returns The multiplication result.
             */
            multiplyT(
                arg: number | la.Vector | la.SparseVector | la.Matrix | la.SparseMatrix
            ): la.Vector | la.Matrix;
            /**
             * Normalizes the columns of the matrix.
             * @returns Self. The columns have been normalized.
             */
            normalizeCols(): la.Matrix;
            /**
             * Adds two matrices.
             * @param mat - The other matrix.
             * @returns The sum of the matrices.
             */
            plus(mat: la.Matrix): la.Matrix;
            /** Prints the matrix on-screen. */
            print(): void;
            /**
             * Puts an element or block into the matrix.
             * @param rowIdx - The row index.
             * @param colIdx - The column index.
             * @param arg - The input argument.
             * @returns Self.
             */
            put(rowIdx: number, colIdx: number, arg: number | la.Matrix): la.Matrix;
            /**
             * Gets the index of the maximum element in the row.
             * @param rowIdx - The row index.
             * @returns The index of the maximum element.
             */
            rowMaxIdx(rowIdx: number): number;
            /**
             * The matrix row norms.
             * @returns The row norms in a dense vector.
             */
            rowNorms(): la.Vector;
            /**
             * Saves the matrix in the output file steam.
             * @param fout - The output file stream.
             * @returns The output file stream.
             */
            save(fout: fs.FOut): fs.FOut;
            /**
             * Set the column of the matrix with the given vector.
             * @param colIdx - The column index.
             * @param vec - The vector being inserted.
             * @returns Self.
             */
            setCol(colIdx: number, vec: la.Vector): la.Matrix;
            /**
             * Set the row of the matrix with the given vector.
             * @param rowIdx - The row index.
             * @param vec - The vector being inserted.
             * @returns Self.
             */
            setCol(rowIdx: number, vec: la.Vector): la.Matrix;
            /**
             * Solves the linear system.
             * @param vec - The dense vector (right-hand side of the equation).
             * @returns The solution of the linear system.
             */
            solve(vec: la.Vector): la.Vector;
            /** Transforms the dense matrix to a sparse matrix. */
            sparse(): la.SparseMatrix;
            /**
             * Transforms the dense matrix into a javascript equivalent
             * (e.g. array of arrays of numbers).
             */
            toArray(): number[][];
            /** Returns a copy of the matrix. */
            toMat(): la.Matrix;
            /** Returns the matrix as a string. */
            toString(): string;
            /** Transposes the matrix. */
            transpose(): la.Matrix;
        }

        /** The Sparse Matrix */
        export class SparseMatrix {
            /** The number of columns. */
            cols: number;
            /** The number or rows. */
            rows: number;
            /**
             * Creates a new instance of the Sparse Matrix.
             * @param args - The input arguments.
             */
            constructor(
                args?: [number, number][][] | la.SparseMatrix,
                rows?: number
            ): la.SparseMatrix;
            /**
             * Gets the matrix element at the position.
             * @param rowIdx - The row index.
             * @param colIdx - The column index.
             * @returns The matrix element.
             */
            at(rowIdx: number, colIdx: number): number;
            clear(): la.SparseMatrix;
            colNorms(): la.Vector;
            frob(): number;
            frob2(): number;
            full(): la.Matrix;
            getCol(colIdx: number): la.SparseVector;
            getColSubmatrix(colIdVec: la.IntVector): la.SparseMatrix;
            load(fin: fs.FIn): la.SparseMatrix;
            minus(mat: la.SparseMatrix): la.SparseMatrix;
            multiply(
                arg: number | la.Vector | la.SparseVector | la.Matrix | la.SparseMatrix
            ): la.Vector | la.Matrix;
            multiplyT(
                arg: number | la.Vector | la.SparseVector | la.Matrix | la.SparseMatrix
            ): la.Vector | la.Matrix;
            /** Gets the number of non-zero values. */
            nnz(): number;
            /**
             * Normalizes the matrix columns.
             * @returns Self. The columns are normalized.
             */
            normalizeCols(): la.SparseMatrix;
            plus(mat: la.SparseMatrix): la.SparseMatrix;
            /** Prints the matrix on-screen. */
            print(): void;
            push(spVec: la.SparseVector): la.SparseMatrix;
            put(rowIdx: number, colIdx: number, num: number): la.SparseMatrix;
            save(fout: fs.FOut, saveMatlab?: boolean = false): fs.FOut;
            setCol(colIdx: number, spVec: la.SparseVector): la.SparseMatrix;
            setRowDim(rowDim: number): void;
            /** Returns the matrix as a string. */
            toString(): string;
            /** Transposes the sparse matrix. */
            transpose(): la.SparseMatrix;
        }

        /** The Dense Vector */
        export class Vector {
            /** Length of the vector. */
            length: number;
            /**
             * Creates a new instance of the Vector.
             * @param args - The input arguments.
             */
            constructor(args?: number[] | la.Vector): la.Vector;
            at(idx: number): number;
            cosine(vec: la.Vector): number;
            diag(): Matrix;
            getMaxIdx(): number;
            inner(vec: la.Vector): number;
            load(fin: fs.FIn): la.Vector;
            loadascii(fin: fs.FIn): la.Vector;
            minus(vec: la.Vector): la.Vector;
            multiply(val: number): la.Vector;
            norm(): number;
            normalize(): la.Vector;
            outer(vec: la.Vector): la.Matrix;
            plus(vec: la.Vector): la.Vector;
            print(): void;
            push(val: number): number;
            pushV(vec: la.Vector): la.Vector;
            put(idx: number, val: number): la.Vector;
            save(fout: fs.FOut): fs.FOut;
            saveascii(fout: fs.FOut): fs.FOut;
            shuffle(): la.Vector;
            sort(arg?: any = true): la.Vector;
            sortPerm(arg?: boolean = true): { vec: la.Vector; perm: la.Vector };
            sparse(): la.SparseVector;
            spDiag(): la.SparseMatrix;
            splice(start: number, deleteCount: number, itemN?: number): la.Vector;
            subVec(arg: number[] | la.IntVector): la.Vector;
            sum(): number;
            toArray(): number[];
            toMat(): la.Matrix;
            toString(): string;
            trunc(idx: number): la.Vector;
            unshift(...args: number): number;
        }

        /** The Sparse Vector */
        export class SparseVector {
            dim: number;
            nnz: number;
            /**
             * Creates a new instance of the Vector.
             * @param args - The input arguments.
             */
            constructor(args?: [number, number][] | la.SparseVector, dim?: number): la.SparseVector;
            at(idx: number): number;
            full(): la.Vector;
            idxVec(): la.Vector;
            inner(arg: la.Vector | la.SparseVector): number;
            multiply(num: number): la.SparseVector;
            norm(): number;
            normalize(): la.SparseVector;
            print(): void;
            put(idx: number, num: number): la.SparseVector;
            sum(): number;
            toString(): string;
            valVec(): la.Vector;
        }

        /** The Boolean Vector */
        export class BoolVector {
            /** Length of the vector. */
            length: number;
            /** Creates a new instance of the Boolean Vector */
            constructor(arg: boolean[] | la.BoolVector);
            at(idx: number): boolean;
            load(fin: fs.FIn): la.BoolVector;
            loadascii(fin: fs.FIn): la.BoolVector;
            push(val: boolean): number;
            pushV(vec: la.BoolVector): number;
            put(idx: number, val: boolean): la.BoolVector;
            save(fout: fs.FOut): fs.FOut;
            saveascii(fout: fs.FOut): fs.FOut;
            shuffle(): la.BoolVector;
            splice(start: number, deleteCount: number, itemN?: number): la.BoolVector;
            toArray(): boolean[];
            toString(): string;
            trunc(idx: number): la.BoolVector;
            unshift(...args: boolean): number;
        }

        /** The Integer Vector */
        export class IntVector {
            /** Length of the vector. */
            length: number;
            /** Creates a new instance of the Integer Vector */
            constructor(arg: number[] | la.IntVector);
            at(idx: number): number;
            getMaxIdx(): number;
            load(fin: fs.FIn): la.IntVector;
            loadascii(fin: fs.FIn): la.IntVector;
            push(val: number): number;
            pushV(vec: la.IntVector): number;
            put(idx: number, val: number): la.IntVector;
            save(fout: fs.FOut): fs.FOut;
            saveascii(fout: fs.FOut): fs.FOut;
            shuffle(): la.IntVector;
            splice(start: number, deleteCount: number, itemN?: number): la.IntVector;
            subVec(arg: number[] | la.IntVector): la.IntVector;
            sum(): number;
            toArray(): number[];
            toString(): string;
            trunc(idx: number): la.IntVector;
            unshift(...args: number): number;
        }

        /** The String Vector */
        export class StrVector {
            /** Length of the vector. */
            length: number;
            /** Creates a new instance of the String Vector */
            constructor(arg: string[] | la.StrVector);
            at(idx: number): string;
            load(fin: fs.FIn): la.StrVector;
            loadascii(fin: fs.FIn): la.StrVector;
            push(val: string): number;
            pushV(vec: la.StrVector): number;
            put(idx: number, val: string): la.StrVector;
            save(fout: fs.FOut): fs.FOut;
            saveascii(fout: fs.FOut): fs.FOut;
            shuffle(): la.StrVector;
            splice(start: number, deleteCount: number, itemN?: string): la.StrVector;
            subVec(arg: number[] | la.IntVector): la.IntVector;
            toArray(): string[];
            toString(): string;
            trunc(idx: number): la.StrVector;
            unshift(...args: string): number;
        }
    }

    /////////////////////////////////////////////
    // Anaytics Module
    /////////////////////////////////////////////

    /** Analytics Module */
    export namespace analytics {
        /**
         * Calculates the non-negative matrix factorization, e.g. `X ~ U*V`.
         * @param X - The non-negative matrix.
         * @param k - The reduced rank, e.g. number of columns in the matrix U and number of rows in matrix V.
         * @param json - The algorithm options.
         */
        export function nmf(
            X: la.Matrix | la.SparseMatrix,
            k: number,
            json?: { iter?: number; tol?: number; verbose?: boolean }
        ): { U: la.Matrix; V: la.Matrix };

        export class BiasedGk {
            init: boolean;
            memory: number;
            samples: number;
            size: number;
            constructor(
                arg?:
                    | {
                          targetProb?: number;
                          eps?: number;
                          compression?: string;
                          useBands?: boolean;
                      }
                    | fs.FIn
            );
            compress(val?: number): analytics.BiasedGk;
            save(fout: fs.FOut): fs.FOut;
            getParams(): {
                targetProb: number;
                eps: number;
                compression: string;
                useBands: boolean;
            };
            quantile(pVals: number | number[]): number | number[];
        }

        export class BufferedTDigest {
            init: boolean;
            memory: number;
            size: number;
            constructor(
                arg?:
                    | {
                          delta?: number;
                          bufferLen?: number;
                          seed?: number;
                      }
                    | fs.FIn
            );
            flush(): analytics.BufferedTDigest;
            getParams(): {
                delta?: number;
                bufferLen?: number;
                seed?: number;
            };
            insert(val: number): analytics.BufferedTDigest;
            quantile(X: number): number;
            save(fout: fs.FOut): fs.FOut;
        }

        export class DpMeans {
            centroids?: la.Matrix;
            idxv?: la.IntVector;
            medoids?: la.IntVector;
            relMeanCentroidDist?: number;
            constructor(
                arg?:
                    | {
                          iter?: number;
                          lambda?: number;
                          minClusters?: number;
                          maxClusters?: number;
                          allowEmpty?: boolean;
                          calcDistQual?: boolean;
                          centroidType?: string;
                          distanceType?: string;
                          verbose?: boolean;
                          fitIdx?: number[];
                          fitStart?: { C: la.Matrix | la.SparseMatrix };
                      }
                    | fs.FIn
            );
            explain(
                X: la.Matrix | la.SparseMatrix
            ): { medoidID: number; featureIDs: la.IntVector; featureContributions: la.Vector }[];
            fit(X: la.Matrix | la.SparseMatrix): analytics.DpMeans;
            getModel(): {
                C: la.Matrix | la.SparseMatrix;
                medoids: la.IntVector;
                idxv: la.IntVector;
            };
            getParams(): {
                iter: number;
                lambda: number;
                minClusters: number;
                maxClusters: number;
                allowEmpty: boolean;
                calcDistQual: boolean;
                centroidType: string;
                distanceType: string;
                verbose: boolean;
                fitIdx: number[];
                fitStart?: { C: la.Matrix | la.SparseMatrix };
            };
            permuteCentroids(mapping: la.IntVector): analytics.DpMeans;
            predict(X: la.Matrix | la.SparseMatrix): la.IntVector;
            save(fout: fs.FOut): fs.FOut;
            setParams(params: {
                iter?: number;
                lambda?: number;
                minClusters?: number;
                maxClusters?: number;
                allowEmpty?: boolean;
                calcDistQual?: boolean;
                centroidType?: string;
                distanceType?: string;
                verbose?: boolean;
                fitIdx?: number[];
                fitStart?: { C: la.Matrix | la.SparseMatrix };
            }): analytics.DpMeans;
            transform(X: la.Matrix | la.SparseMatrix): la.Matrix;
        }

        export class Gk {
            init: boolean;
            memory: number;
            samples: number;
            size: number;
            constructor(
                arg?:
                    | {
                          eps?: number;
                          autoCompress?: boolean;
                          useBands?: boolean;
                      }
                    | fs.FIn
            );
            compress(val?: number): analytics.Gk;
            kolmogorovStat(dist: analytics.Gk): number;
            kolmogorovTest(dist: analytics.Gk, alpha: number): boolean;
            save(fout: fs.FOut): fs.FOut;
            cdf(vals: number | number[]): number | number[];
            getParams(): {
                eps: number;
                autoCompress: boolean;
                useBands: boolean;
            };
            quantile(pVals: number | number[]): number | number[];
        }

        export class KMeans {
            centroids?: la.Matrix;
            idxv?: la.IntVector;
            medoids?: la.IntVector;
            relMeanCentroidDist?: number;
            constructor(
                arg?:
                    | {
                          iter?: number;
                          k?: number;
                          allowEmpty?: boolean;
                          calcDistQual?: boolean;
                          centroidType?: string;
                          distanceType?: string;
                          verbose?: boolean;
                          fitIdx?: number[];
                          fitStart?: { C: la.Matrix | la.SparseMatrix };
                      }
                    | fs.FIn
            );
            explain(
                X: la.Matrix | la.SparseMatrix
            ): { medoidID: number; featureIDs: la.IntVector; featureContributions: la.Vector }[];
            fit(X: la.Matrix | la.SparseMatrix): analytics.KMeans;
            getModel(): {
                C: la.Matrix | la.SparseMatrix;
                medoids: la.IntVector;
                idxv: la.IntVector;
            };
            getParams(): {
                iter: number;
                k: number;
                allowEmpty: boolean;
                calcDistQual: boolean;
                centroidType: string;
                distanceType: string;
                verbose: boolean;
                fitIdx: number[];
                fitStart?: { C: la.Matrix | la.SparseMatrix };
            };
            permuteCentroids(mapping: la.IntVector): analytics.KMeans;
            predict(X: la.Matrix | la.SparseMatrix): la.IntVector;
            save(fout: fs.FOut): fs.FOut;
            setParams(params: {
                iter?: number;
                k?: number;
                allowEmpty?: boolean;
                calcDistQual?: boolean;
                centroidType?: string;
                distanceType?: string;
                verbose?: boolean;
                fitIdx?: number[];
                fitStart?: { C: la.Matrix | la.SparseMatrix };
            }): analytics.DpMeans;
            transform(X: la.Matrix | la.SparseMatrix): la.Matrix;
        }

        export class LogReg {
            weights?: la.Vector;
            constructor(arg?: { lambda?: number; intercept?: boolean } | fs.FIn);
            fit(X: la.Matrix, y: la.Vector, eps?: number): analytics.LogReg;
            getParams(): { lambda: number; intercept: boolean };
            predict(X: la.Vector): number;
            save(fout: fs.FOut): fs.FOut;
            setParams(params: { lambda?: number; intercept?: boolean }): analytics.LogReg;
        }

        export class MDS {
            constructor(
                arg?:
                    | { maxSecs?: number; maxStep?: number; minDiff?: number; distType?: string }
                    | fs.FIn
            );
            fitTransform(mat: la.Matrix | la.SparseMatrix, callback: any): la.Matrix;
            getParams(): { maxSecs: number; maxStep: number; minDiff: number; distType: string };
            save(fout: fs.FOut): fs.FOut;
            setParams(params: {
                maxSecs?: number;
                maxStep?: number;
                minDiff?: number;
                distType?: string;
            }): analytics.MDS;
        }

        export class NearestNeighborAD {
            init: boolean;
            constructor(arg?: { rate?: number; windowSize?: number } | fs.FIn);
            decisionFunction(x: la.Vector): number;
            explain(
                X: la.SparseVector
            ): {
                nearestID: number;
                distance: number;
                features: { id: number; val: number; nearVal: number; contribution: number }[];
                oldestID: number;
                newestID: number;
            };
            fit(A: la.SparseMatrix, idVec?: la.IntVector): analytics.NearestNeighborAD;
            getModel(): { rate: number; thresh: number };
            getParams(): { rate: number; windowSize: number };
            partialFit(X: la.SparseVector, recId: number): analytics.NearestNeighborAD;
            predict(X: la.SparseVector): number;
            save(fout: fs.FOut): fs.FOut;
            setParams(params: { rate?: number; windowSize?: number }): analytics.NearestNeighborAD;
        }

        export class OneVsAll {
            constructor(arg?: { model?: any; modelParam?: any; cats?: number; verbose?: boolean });
            decisionFunction(
                X: la.Vector | la.SparseVector | la.Matrix | la.SparseMatrix
            ): la.Vector | la.matrix;
            fit(X: la.Matrix | la.SparseMatrix, y: la.Vector): analytics.OneVsAll;
            getParams(): { model: any; modelParam: any; cats: number; verbose: boolean };
            predict(
                X: la.Vector | la.SparseVector | la.Matrix | la.SparseMatrix
            ): number | la.IntVector;
            setParams(params: {
                model?: any;
                modelParam?: any;
                cats?: number;
                verbose?: boolean;
            }): analytics.OneVsAll;
        }

        export class PCA {
            constructor(arg?: { k?: number; iter?: number } | fs.FIn);
            fit(X: la.Matrix): void;
            getModel(): { P: la.Matrix; lambda: la.Vector; mu: la.Vector };
            getParams(): { k: number; iter: number };
            inverseTransform(x: la.Vector | la.Matrix): la.Vector | la.Matrix;
            save(fout: fs.FOut): fs.FOut;
            setParams(params: { k?: number; iter?: number }): analytics.PCA;
            transform(X: la.Vector | la.Matrix): la.Vector | la.Matrix;
        }

        export class PropHazards {
            weights?: la.Vector;
            constructor(arg?: { lambda?: number } | fs.FIn);
            fit(X: la.Matrix, y: la.Vector, eps?: number): analytics.PropHazards;
            getParams(): { lambda: number };
            predict(x: la.Vector): number;
            save(fout: fs.FOut): fs.FOut;
            setParams(params: { lambda?: number }): analytics.PropHazards;
        }

        export class RecLinReg {
            dim?: number;
            weights?: la.Vector;
            constructor(arg: { dim: number; regFact?: number; forgetFact?: number } | fs.FIn);
            fit(X: la.Matrix, vec: la.Vector): analytics.RecLinReg;
            getModel(): { weights: la.Vector };
            getParams(): { dim: number; regFact: number; forgetFact: number };
            partialFit(vec: la.Vector, num: number): analytics.RecLinReg;
            predict(vec: la.Vector): number;
            save(fout: fs.FOut): fs.FOut;
            setParams(params: {
                dim: number;
                regFact?: number;
                forgetFact?: number;
            }): analytics.RecLinReg;
        }

        export class RecommenderSys {
            constructor(
                arg?: { iter?: number; k?: number; tol?: number; verbose?: boolean } | fs.FIn
            );
            fit(X: la.Matrix | la.SparseMatrix): analytics.RecommenderSys;
            getModel(): { U: la.Matrix; V: la.Matrix };
            getParams(): { iter: number; k: number; tol: number; verbose: boolean };
            save(fout: fs.FOut): fs.FOut;
            setParams(params: {
                iter?: number;
                k?: number;
                tol?: number;
                verbose?: boolean;
            }): analytics.RecommenderSys;
        }

        export class RidgeReg {
            weights: la.Vector;
            constructor(arg?: { gamma?: number } | fs.FIn);
            decisionFunction(x: la.Vector): number;
            fit(X: la.Matrix, y: la.Vector): analytics.RidgeReg;
            getModel(): { weights: la.Vector };
            getParams(): { gamma: number };
            predict(x: la.Vector): number;
            save(fout: fs.FOut): fs.FOut;
            setParams(gamma: number | { gamma: number }): analytics.RidgeReg;
        }

        export class Sigmoid {
            constructor(arg?: fs.FIn);
            decisionFunction(x: number | la.Vector): number | la.Vector;
            fit(x: la.Vector, y: la.Vector): analytics.Sigmoid;
            getModel(): { A: number; B: number };
            getParams(): null;
            predict(x: number | la.Vector): number | la.Vector;
            save(fout: fs.FOut): fs.FOut;
            setParams(): analytics.Sigmoid;
        }

        interface ISVMParams {
            algorithm?: string;
            c?: number;
            j: number;
            eps?: number;
            batchSize?: number;
            maxIterations?: number;
            maxTime?: number;
            minDiff?: number;
            type?: string;
            kernel?: string;
            gamma?: number;
            p?: number;
            degree?: number;
            nu?: number;
            coef0?: number;
            cacheSize?: number;
            verbose?: boolean;
        }

        export class SVC {
            weights?: la.Vector;
            constructor(arg?: ISVMParams | fs.FIn);
            decisionFunction(
                X: la.Vector | la.SparseVector | la.Matrix | la.SparseMatrix
            ): number | la.Vector;
            fit(X: la.Matrix | la.SparseMatrix, y: la.Vector): analytics.SVC;
            getModel(): { weights: la.Vector };
            getParams(): ISVMParams;
            predict(
                X: la.Vector | la.SparseVector | la.Matrix | la.SparseMatrix
            ): number | la.Vector;
            save(fout: fs.FOut): fs.FOut;
            setParams(params: ISVMParams): analytics.SVC;
        }

        export class SVR {
            weights?: la.Vector;
            constructor(arg?: ISVMParams | fs.FIn);
            decisionFunction(
                X: la.Vector | la.SparseVector | la.Matrix | la.SparseMatrix
            ): number | la.Vector;
            fit(X: la.Matrix | la.SparseMatrix, y: la.Vector): analytics.SVR;
            getModel(): { weights: la.Vector };
            getParams(): ISVMParams;
            predict(
                X: la.Vector | la.SparseVector | la.Matrix | la.SparseMatrix
            ): number | la.Vector;
            save(fout: fs.FOut): fs.FOut;
            setParams(params: ISVMParams): analytics.SVR;
        }

        export class TDigest {
            init: boolean;
            memory: number;
            size: number;
            constructor(arg?: { minCount?: number; clusters?: number } | fs.FIn);
            getParams(): { minCount: number; clusters: number };
            insert(x: number): analytics.TDigest;
            quantile(x: number): number;
            save(fout: fs.FOut): fs.FOut;
        }

        export class ThresholdModel {
            constructor(arg?: { target?: string; level?: any });
            decisionFunction(x: number | la.Vector): number | la.Vector;
            fit(x: la.Vector, y: la.Vector): analytics.ThresholdModel;
            predict(x: number | la.Vector): number | la.Vector;
        }

        export class Tokenizer {
            constructor(arg?: { type?: string });
            getParagraphs(str: string): string[];
            getSentences(str: string): string[];
            getTokens(str: string): string[];
        }

        export class ActiveLearner {
            constructor(
                arg?: { learner?: { disableAsserts?: boolean }; SVC?: ISVMParams } | fs.FIn
            );
            getQueryIdx(num?: number): number[];
            getSVC(): analytics.SVC;
            getX(): la.Matrix | la.SparseMatrix;
            gety(): la.Vector;
            load(input: string | fs.FIn): analytics.ActiveLearner;
            retrain(): void;
            save(output: string | fs.FOut): fs.FOut;
            setLabel(idx: number, label: number): void;
            setX(X: la.Matrix | la.SparseMatrix): void;
            sety(y: number[] | la.Vector | la.IntVector | Map): void;
        }

        export namespace metrics {
            // TODO: add metrices
        }

        /**
         * Preprocessing Module
         *
         * Contains functions for preparing labels in formats acceptable by
         * models in the `analytics` namespace.
         */
        export namespace preprocessing {
            /**
             * Applies the models `decisionFunction` method on each column of the matrix `X`.
             * @param model - The model from the `analytics` namespace which has the `decisionFunction` method.
             * @param X - The matrix used to be sent to the `decisionFunction`.
             * @returns The vector of the `decisionFunction` results.
             */
            export function applyModel(model: any, X: la.Matrix | la.SparseMatrix): la.Vector;

            /**
             * Transform given array of labels into binary vector with different
             * numeric value for elements when label matches specified label and
             * for other elements. By default, these values are +1 for matching
             * labels, and -1 for the rest.
             */
            export class Binarizer {
                /**
                 * Creates a new instance of the Binarizer.
                 * @param y - The labels.
                 * @param positiveLabel - Positive label.
                 * @param positiveId - The value associated with the positive value.
                 * @param negativeId - The value associated with the negative value.
                 */
                constructor(
                    y: number[],
                    positiveLabel: string | number,
                    positiveID?: number,
                    negativeID?: number
                );
                /**
                 * Transforms the given labels to binary numeric vector.
                 * @param y - The labels.
                 * @returns Binarized vector.
                 */
                transform(y: number[] | string[] | la.Vector | la.StrVector): la.Vector;
            }
        }
    }

    /////////////////////////////////////////////
    // File System Module
    /////////////////////////////////////////////

    /** File-System Module */
    export namespace fs {
        /**
         * Input File Stream
         * Used for reading files.
         */
        export class FIn {
            /** True, if the file stream is at its end. */
            eof: boolean;
            /** Length of the input stream. */
            length: number;
            /**
             * Creates a new instance of the Input File Stream.
             * @param fileName - The file name to be opened.
             */
            constructor(fileName: string);
            /** CLoses the input stream. */
            close(): void;
            /** Reads a single character. */
            getCh(): string;
            /** Checks if the input stream is closed. */
            isClosed(): boolean;
            /** Peeks the next character. */
            peekCh(): string;
            /** Reads the whole stream. */
            readAll(): string;
            /** Reads the JSON that was serialized using `fs.FOut.writeJson`. */
            readJson(): { [key: any]: any };
            /** Reads the next line. */
            readLine(): string;
            /** Reads a string that was serialized using `fs.FOut.writeBinary`. */
            readString(): string;
        }
        /**
         * Output File Stream
         * Used for writing files.
         */
        export class FOut {
            /**
             * Creates a new instane of the Output File Stream.
             * @param fileName - The file name to which we will write.
             * @param append - True, append to the file. False, otherwise.
             */
            constructor(fileName: string, append?: boolean = false);
            /** Closes the Output stream. */
            close(): void;
            /** Flushes the output stream. */
            flush(): fs.FOut;
            /**
             * Writes the input in a human readable form.
             * @param arg - The input.
             * @returns Self.
             */
            write(arg: string | number | { [key: any]: any }): fs.FOut;
            /**
             * Write the input in binary form.
             * @param arg - The input.
             * @returns Self.
             */
            writeBinary(arg: string | number | { [key: any]: any }): fs.FOut;
            /**
             * Saves the JSON object. Can be read by `fs.FIn.readJson`.
             * @param obj - The object.
             * @returns Self.
             */
            writeJson(obj: { [key: any]: any }): fs.FOut;
            /**
             * Writes a string and adds a new line.
             * @param str - The string.
             * @returns Self.
             */
            writeLine(str: string): fs.FOut;
        }

        /**
         * Copies the file to a new location.
         * @param source - The source path.
         * @param dest - The destination location.
         */
        export function copy(source: string, dest: string): void;
        /**
         * Deletes the file.
         * @param fileName - The file name.
         * @returns True, if the file was deleted. Otherwise, False.
         */
        export function del(fileName: string): boolean;
        /**
         * Checks if the file exists.
         * @param fileName - The file name.
         * @returns True, if the file exists. Otherwise, False.
         */
        export function exists(fileName: string): boolean;
        /**
         * Returns the file info.
         * @param fileName - The file name.
         * @returns the file info object.
         */
        export function fileInfo(
            fileName: string
        ): {
            createTime: string;
            lastAccessTime: string;
            lastWriteTime: string;
            size: number;
        };
        /**
         * Returns a list of files in the folder.
         * @param dirName - The folder name.
         * @param fileExtension - Results are filtered by file extension.
         * @param recursive - If True, recursively searches for file names.
         * @returns The array of file names.
         */
        export function listFile(
            dirName: string,
            fileExtension?: string,
            recursive?: boolean = false
        ): string[];
        /**
         * Creates a new directory.
         * @param dirName - The directory name.
         * @returns True, if the directory was created. Otherwise, False.
         */
        export function mkdir(dirName: string): boolean;
        /**
         * Moves a file to the target location.
         * @param source - The source file path.
         * @param dest - The target location path.
         */
        export function move(source: string, dest: string): void;
        /**
         * Opens a file in append mode.
         * @param fileName - The file path.
         * @returns The Output File Stream.
         */
        export function openAppend(fileName: string): fs.FOut;
        /**
         * Opens a file in read mode.
         * @param fileName - The file path.
         * @returns The Input File Stream.
         */
        export function openRead(fileName: string): fs.FIn;
        /**
         * Opens a file in write mode.
         * @param fileName - The file path.
         * @returns The Output File Stream.
         */
        export function openWrite(fileName: string): fs.FOut;
        /**
         * Reads a buffer, containing a CSV file, line by line and calls a callback
         * for each line. As specified in CSV format standard defined in RFC 4180
         * double-quotes (") can be used as escape characters. If a double-quote appears
         * in a field, the field nust be enclosed in double-quotes and the double-quote
         * appearing inside a field must be escaped by preceding it with another double
         * quote. The callback function accepts an array with the values of the current line.
         * @param buffer - The NodeJS buffer.
         * @param opts - The option parameters.
         */
        export function readCsvLines(
            buffer: Buffer,
            opts: {
                onLine: any;
                onEnd: any;
                delimiter: string;
                lineLimit: number;
                skipLines: number;
            }
        ): void;
        /**
         * Reads the buffer and calls a function on each line.
         * @param buffer - The input buffer.
         * @param onLine - A callback that gets called on each line.
         * @param onEnd - A callback that gets called after all lines have been read.
         */
        export function readLines(buffer: string | fs.FIn | Buffer, onLine: any, onEnd: any): void;
        /**
         * Renames a file.
         * @param source - The source file location.
         * @param dest - The target location path.
         */
        export function rename(source: string, dest: string): void;
        /**
         * Removes a directory.
         * @param dirName - The directory name.
         * @returns True, if the directory was removed. Otherwise, False.
         */
        export function rmdir(dirName: string): boolean;
    }

    /////////////////////////////////////////////
    // Statistics Module
    /////////////////////////////////////////////

    /** Statistics Module  */
    export namespace statistics {
        /**
         * Calculates the z-score for a point sampled from a Gaussian distribution.
         * The z-score indicates how many standard deviations an element is from
         * the meam and can be calculated using the following formula: `z = (x - mu) / sigma`.
         * @param x - The sample point.
         * @param mu - Mean of the distribution.
         * @param sigma - Variance of the distribution.
         * @returns The z-score of the sampled point.
         */
        export function getZScore(x: number, mu: number, sigma: number): number;

        /**
         * Calculates the mean value(s).
         * @param input - The input.
         */
        export function mean(input: la.Vector | la.Matrix): number | la.Vector;

        /**
         * Calculates the standard deviation(s).
         * @param X - The input vector or matrix.
         * @param flag - If set to 0, it normalizes X by `n-1`. If set to 1, normalizes by `n`. Defaults to 0.
         * @param dim - Computes the standard deviations along the dimension of X specified by parameter dim. If set to 1, calculates the column standard deviation. If set to 2, calculates the row standard deviation. Defaults to 1.
         * @returns The standard deviation(s).
         */
        export function std(
            X: la.Vector | la.Matrix,
            flag?: number,
            dim?: number
        ): number | la.Vector;

        /**
         * Calculates the standard deviation, mean vector and z-score of each column of matrix.
         * @param X - The matrix.
         * @param flag - If set to 0, it normalizes X by `n-1`; if set to 1, it normalizes by `n`. Defaults to 0.
         * @param dim - Computes the standard deviations along the dimension of mat specified by parameter dim. If set to 1, calculates the column standard deviation. If set to 2, calculates the row standard deviation. Defaults to 1.
         * @returns The standard deviation `sigma`, the mean `mu` and the `z-score` of the input.
         */
        export function zscore(
            X: la.Matrix,
            flag?: boolean,
            dim?: number
        ): {
            sigma: la.Vector;
            mu: la.Vector;
            Z: la.Matrix;
        };
    }

    /////////////////////////////////////////////
    // Hashtable Module
    /////////////////////////////////////////////

    /** Hastable Module  */
    export namespace ht {
        /** The Integer-Float Hashmap */
        export class IntFltMap {
            /** Number of key/dat pairs. */
            length: number;
            /**
             * Returns the n-th dat.
             * @param n - Hashmap dat index number.
             * @returns the n-th dat value.
             */
            dat(n: number): number;
            /**
             * Returns the dat at the given key.
             * @param key - Hashmap key.
             * @returns The hashmap dat.
             */
            get(key: number): number;
            /**
             * Checks if the hashmap has the key.
             * @param key - The hashmap key.
             * @returns True, if the map contains the key. Otherwise, False.
             */
            hasKey(key: number): boolean;
            /**
             * Returns the n-th key.
             * @param n - The hashmap key index number.
             * @returns The n-th key.
             */
            key(n: number): number;
            /**
             * Returns the ID of the key provided as the parameter.
             * @param key - The hashmap key.
             * @returns The hashmap index number.
             */
            keyId(key: number): number;
            /**
             * Loads the hashtable from the input file stream.
             * @param fin - The input file stream.
             * @returns Self.
             */
            load(fin: fs.FIn): ht.IntFltMap;
            /**
             * Adds or updates the key-value pair.
             * @param key - The hashmap key.
             * @param data - The hashmap data.
             * @returns Self.
             */
            put(key: number, data: number): ht.IntFltMap;
            /**
             * Saves the hastable.
             * @param fout - The output file stream.
             * @returns The output file stream.
             */
            save(fout: fs.FOut): fs.FOut;
            /**
             * Sorts by dat.
             * @param asc - If `true`, sorts in ascending order. Defaults to `true`.
             * @returns Self.
             */
            sortDat(asc?: boolean): ht.IntFltMap;
            /**
             * Sorts by keys.
             * @param asc - If `true`, sorts in ascending order. Defaults to `true`.
             * @returns Self.
             */
            sortKey(asc?: boolean): ht.IntFltMap;
        }

        /** The Integer-Integer Hashmap */
        export class IntIntMap {
            /** Number of key/dat pairs. */
            length: number;
            /**
             * Returns the n-th dat.
             * @param n - Hashmap dat index number.
             * @returns the n-th dat value.
             */
            dat(n: number): number;
            /**
             * Returns the dat at the given key.
             * @param key - Hashmap key.
             * @returns The hashmap dat.
             */
            get(key: number): number;
            /**
             * Checks if the hashmap has the key.
             * @param key - The hashmap key.
             * @returns True, if the map contains the key. Otherwise, False.
             */
            hasKey(key: number): boolean;
            /**
             * Returns the n-th key.
             * @param n - The hashmap key index number.
             * @returns The n-th key.
             */
            key(n: number): number;
            /**
             * Returns the ID of the key provided as the parameter.
             * @param key - The hashmap key.
             * @returns The hashmap index number.
             */
            keyId(key: number): number;
            /**
             * Loads the hashtable from the input file stream.
             * @param fin - The input file stream.
             * @returns Self.
             */
            load(fin: fs.FIn): ht.IntIntMap;
            /**
             * Adds or updates the key-value pair.
             * @param key - The hashmap key.
             * @param data - The hashmap data.
             * @returns Self.
             */
            put(key: number, data: number): ht.IntIntMap;
            /**
             * Saves the hastable.
             * @param fout - The output file stream.
             * @returns The output file stream.
             */
            save(fout: fs.FOut): fs.FOut;
            /**
             * Sorts by dat.
             * @param asc - If `true`, sorts in ascending order. Defaults to `true`.
             * @returns Self.
             */
            sortDat(asc?: boolean): ht.IntIntMap;
            /**
             * Sorts by keys.
             * @param asc - If `true`, sorts in ascending order. Defaults to `true`.
             * @returns Self.
             */
            sortKey(asc?: boolean): ht.IntIntMap;
        }

        /** The Integer-String Hashmap */
        export class IntStrMap {
            /** Number of key/dat pairs. */
            length: number;
            /**
             * Returns the n-th dat.
             * @param n - Hashmap dat index number.
             * @returns the n-th dat value.
             */
            dat(n: number): string;
            /**
             * Returns the dat at the given key.
             * @param key - Hashmap key.
             * @returns The hashmap dat.
             */
            get(key: number): string;
            /**
             * Checks if the hashmap has the key.
             * @param key - The hashmap key.
             * @returns True, if the map contains the key. Otherwise, False.
             */
            hasKey(key: number): boolean;
            /**
             * Returns the n-th key.
             * @param n - The hashmap key index number.
             * @returns The n-th key.
             */
            key(n: number): number;
            /**
             * Returns the ID of the key provided as the parameter.
             * @param key - The hashmap key.
             * @returns The hashmap index number.
             */
            keyId(key: number): number;
            /**
             * Loads the hashtable from the input file stream.
             * @param fin - The input file stream.
             * @returns Self.
             */
            load(fin: fs.FIn): ht.IntStrMap;
            /**
             * Adds or updates the key-value pair.
             * @param key - The hashmap key.
             * @param data - The hashmap data.
             * @returns Self.
             */
            put(key: number, data: string): ht.IntStrMap;
            /**
             * Saves the hastable.
             * @param fout - The output file stream.
             * @returns The output file stream.
             */
            save(fout: fs.FOut): fs.FOut;
            /**
             * Sorts by dat.
             * @param asc - If `true`, sorts in ascending order. Defaults to `true`.
             * @returns Self.
             */
            sortDat(asc?: boolean): ht.IntStrMap;
            /**
             * Sorts by keys.
             * @param asc - If `true`, sorts in ascending order. Defaults to `true`.
             * @returns Self.
             */
            sortKey(asc?: boolean): ht.IntStrMap;
        }

        /** The String-Float Hashmap */
        export class StrFltMap {
            /** Number of key/dat pairs. */
            length: number;
            /**
             * Returns the n-th dat.
             * @param n - Hashmap dat index number.
             * @returns the n-th dat value.
             */
            dat(n: number): number;
            /**
             * Returns the dat at the given key.
             * @param key - Hashmap key.
             * @returns The hashmap dat.
             */
            get(key: string): number;
            /**
             * Checks if the hashmap has the key.
             * @param key - The hashmap key.
             * @returns True, if the map contains the key. Otherwise, False.
             */
            hasKey(key: string): boolean;
            /**
             * Returns the n-th key.
             * @param n - The hashmap key index number.
             * @returns The n-th key.
             */
            key(n: number): string;
            /**
             * Returns the ID of the key provided as the parameter.
             * @param key - The hashmap key.
             * @returns The hashmap index number.
             */
            keyId(key: string): number;
            /**
             * Loads the hashtable from the input file stream.
             * @param fin - The input file stream.
             * @returns Self.
             */
            load(fin: fs.FIn): ht.StrFltMap;
            /**
             * Adds or updates the key-value pair.
             * @param key - The hashmap key.
             * @param data - The hashmap data.
             * @returns Self.
             */
            put(key: string, data: number): ht.StrFltMap;
            /**
             * Saves the hastable.
             * @param fout - The output file stream.
             * @returns The output file stream.
             */
            save(fout: fs.FOut): fs.FOut;
            /**
             * Sorts by dat.
             * @param asc - If `true`, sorts in ascending order. Defaults to `true`.
             * @returns Self.
             */
            sortDat(asc?: boolean): ht.StrFltMap;
            /**
             * Sorts by keys.
             * @param asc - If `true`, sorts in ascending order. Defaults to `true`.
             * @returns Self.
             */
            sortKey(asc?: boolean): ht.StrFltMap;
        }

        /** The String-Integer Hashmap */
        export class StrIntMap {
            /** Number of key/dat pairs. */
            length: number;
            /**
             * Returns the n-th dat.
             * @param n - Hashmap dat index number.
             * @returns the n-th dat value.
             */
            dat(n: number): number;
            /**
             * Returns the dat at the given key.
             * @param key - Hashmap key.
             * @returns The hashmap dat.
             */
            get(key: string): number;
            /**
             * Checks if the hashmap has the key.
             * @param key - The hashmap key.
             * @returns True, if the map contains the key. Otherwise, False.
             */
            hasKey(key: string): boolean;
            /**
             * Returns the n-th key.
             * @param n - The hashmap key index number.
             * @returns The n-th key.
             */
            key(n: number): string;
            /**
             * Returns the ID of the key provided as the parameter.
             * @param key - The hashmap key.
             * @returns The hashmap index number.
             */
            keyId(key: string): number;
            /**
             * Loads the hashtable from the input file stream.
             * @param fin - The input file stream.
             * @returns Self.
             */
            load(fin: fs.FIn): ht.StrIntMap;
            /**
             * Adds or updates the key-value pair.
             * @param key - The hashmap key.
             * @param data - The hashmap data.
             * @returns Self.
             */
            put(key: string, data: number): ht.StrIntMap;
            /**
             * Saves the hastable.
             * @param fout - The output file stream.
             * @returns The output file stream.
             */
            save(fout: fs.FOut): fs.FOut;
            /**
             * Sorts by dat.
             * @param asc - If `true`, sorts in ascending order. Defaults to `true`.
             * @returns Self.
             */
            sortDat(asc?: boolean): ht.StrIntMap;
            /**
             * Sorts by keys.
             * @param asc - If `true`, sorts in ascending order. Defaults to `true`.
             * @returns Self.
             */
            sortKey(asc?: boolean): ht.StrIntMap;
        }

        /** The String-String Hashmap */
        export class StrStrMap {
            /** Number of key/dat pairs. */
            length: number;
            /** The class description. */
            classDesc(): string;
            /**
             * Returns the n-th dat.
             * @param n - Hashmap dat index number.
             * @returns the n-th dat value.
             */
            dat(n: number): string;
            /**
             * Returns the dat at the given key.
             * @param key - Hashmap key.
             * @returns The hashmap dat.
             */
            get(key: string): string;
            /**
             * Checks if the hashmap has the key.
             * @param key - The hashmap key.
             * @returns True, if the map contains the key. Otherwise, False.
             */
            hasKey(key: string): boolean;
            /**
             * Returns the n-th key.
             * @param n - The hashmap key index number.
             * @returns The n-th key.
             */
            key(n: number): string;
            /**
             * Returns the ID of the key provided as the parameter.
             * @param key - The hashmap key.
             * @returns The hashmap index number.
             */
            keyId(key: string): number;
            /**
             * Loads the hashtable from the input file stream.
             * @param fin - The input file stream.
             * @returns Self.
             */
            load(fin: fs.FIn): ht.StrStrMap;
            /**
             * Adds or updates the key-value pair.
             * @param key - The hashmap key.
             * @param data - The hashmap data.
             * @returns Self.
             */
            put(key: string, data: string): ht.StrStrMap;
            /**
             * Saves the hastable.
             * @param fout - The output file stream.
             * @returns The output file stream.
             */
            save(fout: fs.FOut): fs.FOut;
            /**
             * Sorts by dat.
             * @param asc - If `true`, sorts in ascending order. Defaults to `true`.
             * @returns Self.
             */
            sortDat(asc?: boolean): ht.StrStrMap;
            /**
             * Sorts by keys.
             * @param asc - If `true`, sorts in ascending order. Defaults to `true`.
             * @returns Self.
             */
            sortKey(asc?: boolean): ht.StrStrMap;
        }
    }

    /////////////////////////////////////////////
    // Shared component definitions
    /////////////////////////////////////////////

    export interface BaseParams {
        mode: string;
        dbPath: string;
        schema?: any;
    }

    interface IStoreInfo {
        storeId: number;
        storeName: string;
        storeRecords: number;
        fields: any;
        keys: any;
        joins: any;
    }

    interface IField {
        id: number;
        name: string;
        type: string;
        nullable: boolean;
        internal: boolean;
        primary: boolean;
    }

    interface IJoin {
        id: number;
        name: string;
        store: string;
        inverse: string;
        type: string;
        key: IKey;
    }

    interface IKey {
        name: string;
        store: Store;
        fq: la.IntVector;
        vocabulary: la.StrVector;
    }

    enum IFtrExtDateWindowUnits {
        DAY = "day",
        WEEK = "week",
        MONTH = "month",
        YEAR = "year",
        HALFDAY = "12hours",
        SIX_HOURS = "6hours",
        FOUR_HOURS = "4hours",
        TWO_HOURS = "2hours",
        HOUR = "hour",
        HALF_HOUR = "30minutes",
        QUARTER_HOUR = "15minutes",
        TEN_MINUTES = "10minutes",
        MINUTE = "minute",
        SECOND = "second",
    }

    interface IFeatureExtractor {
        type: string;
        source: string;
    }

    export interface IFeatureExtractorConstant extends IFeatureExtractor {
        type: "constrant";
        const?: number;
    }

    export interface IFeatureExtractorDateWindow extends IFeatureExtractor {
        type: "dateWindow";
        unit?: IFtrExtDateWindowUnits;
        window?: number;
        normalize?: boolean;
        start: number;
        end: number;
    }
}
