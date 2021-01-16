import {
    EMethodStatus,
    EMethodType,
    IMethodCreateParams,
    ISubsetRecord,
} from "../../../interfaces";

import qm from "qminer";
import ModelBasic from "./ModelBasic";

// get the promise version of setImmediate
import { promisify } from "util";
const setImmediateP = promisify(setImmediate);

export default class ClusteringKMeans extends ModelBasic {
    private result: { [key: string]: any };
    private featureSpace: qm.FeatureSpace | null;
    private model: qm.analytics.KMeans | null;

    /**
     * Creates a new ClusteringKMeans instance.
     * @param base - The qminer base.
     * @param subset - The subset.
     * @param params - The method parameters.
     */
    constructor(base: qm.Base, subset: ISubsetRecord, params: IMethodCreateParams["parameters"]) {
        super(base, subset, params, EMethodType.CLUSTERING_KMEANS);
        this.result = {};
        this.featureSpace = null;
        this.model = null;
    }

    /** Initializes the model. */
    async init(): Promise<ClusteringKMeans> {
        // create the feature space and update it with records
        const { features, distanceType } = this._setFeatures();
        this.featureSpace = new qm.FeatureSpace(this.base, features);
        await setImmediateP(this.featureSpace.updateRecords(this.subset.hasElements));
        // initalize the clustering model
        this.model = new qm.analytics.KMeans({
            ...this.params.method,
            allowEmpty: false,
            distanceType,
        });
        return this;
    }

    /** Trains the model. */
    async train(): Promise<ClusteringKMeans> {
        // set the method status
        this.method.status = EMethodStatus.LOADING;
        // get the feature matrix and train the model
        const matrix = this.featureSpace?.extractSparseMatrix(
            this.subset.hasElements
        ) as qm.la.SparseMatrix;
        await this._trainModel(matrix as qm.la.SparseMatrix);
        // get the cluster statistics
        this._clusterStatistics(matrix);
        // set the method results
        this.method.result = this.result;
        this.method.status = EMethodStatus.FINISHED;
        return this;
    }

    /////////////////////////////////////////////
    // HELPER FUNCTIONS
    /////////////////////////////////////////////

    /** Set the clustering features */
    _setFeatures() {
        let features: any[] = [];
        let distanceType = "";
        switch (this.params.method?.clusteringType) {
            case "text":
                // clustering is performed on text fields
                distanceType = "Cos";
                features = [
                    {
                        type: "text",
                        field: this.params.fields,
                        ngrams: 2,
                        hashDimension: 20000,
                        tokenizer: {
                            type: "simple",
                            stemmer: "porter",
                            stopwords: {
                                language: "en",
                                words: [""],
                                ...this.params.processing?.stopwords,
                            },
                        },
                    },
                    {
                        type: "constant",
                        const: 0.000001,
                    },
                ];
                break;
            case "number":
                // the clustering is performed on number fields
                distanceType = "Euclid";
                features = this.params.fields?.map((field) => ({
                    type: "numeric",
                    field,
                })) as { type: string; field: string }[];
                break;
            default:
                throw new Error(
                    `Invalid clustering type; clusteringType=${this.params.method?.clusteringType}`
                );
        }
        features.forEach((feature) => {
            feature.source = "Dataset";
        });
        return { features, distanceType };
    }

    /** Model training wrapper (for Promise)  */
    _trainModel(matrix: qm.la.SparseMatrix) {
        return new Promise<null>((resolve, reject) => {
            this.model?.fitAsync(matrix, (error) => (error ? reject(error) : resolve(null)));
        });
    }

    /**
     * Calculates the cluster statistics.
     * @param matrix - The document features.
     */
    _clusterStatistics(matrix: qm.la.SparseMatrix) {
        // prepare clusters statistics placeholder
        const clusters = Array(...Array(this.params.method?.k)).map(() => ({
            distance: {
                max: -1,
                min: -1,
                avg: -1,
            },
            count: -1,
            docIds: [] as number[],
            subsetId: -1,
        }));
        // get the subset elements
        const documents = this.subset.hasElements as qm.RecordSet;
        // get the document cluster ids
        const idxv = this.model?.getModel().idxv as qm.la.IntVector;
        // placeholder for cluster associated documents
        const clusterIds: { [key: number]: number[] } = {};
        // iterate through all cluster ids
        for (let id = 0; id < idxv.length; id++) {
            const clusterId = idxv[id] as number;
            const docId = (documents[id] as qm.Record).$id;
            clusters[clusterId].docIds.push(docId);
            // save the cluster positions
            if (!clusterIds[clusterId]) {
                clusterIds[clusterId] = [];
            }
            clusterIds[clusterId].push(id);
        }
        // calculate the distances of the matrix
        for (const [clusterId, docIds] of Object.entries(clusterIds)) {
            const positions = new qm.la.IntVector(docIds);
            const submatrix = matrix.getColSubmatrix(positions);
            const centroid = this.model?.centroids?.getCol(parseInt(clusterId)) as qm.la.Vector;

            // assign the number of documents in cluster
            clusters[parseInt(clusterId)].count = submatrix.cols;

            let dists = new qm.la.Vector();
            if (this.params.method?.clusteringType === "text") {
                submatrix.normalizeCols();
                centroid.normalize();
                // get the cosine distances between the documents and centroid
                dists = submatrix.multiplyT(centroid) as qm.la.Vector;
                dists = qm.la.ones(dists.length).minus(dists);
            } else if (this.params.method?.clusteringType === "number") {
                // calculate the Euclidean distances between the centroid and documents
                for (let id = 0; id < submatrix.cols; id++) {
                    const subs = submatrix.getCol(id).full().minus(centroid);
                    const dist =
                        subs
                            .toArray()
                            .map((val) => val ** 2)
                            .reduce((prev, curr) => prev + curr, 0) ** 0.5;
                    dists.push(dist);
                }
            }
            // save the distances
            clusters[parseInt(clusterId)].distance.avg = dists.sum() / submatrix.cols;
            clusters[parseInt(clusterId)].distance.max = dists[dists.getMaxIdx()];
            clusters[parseInt(clusterId)].distance.min = dists[dists.multiply(-1).getMaxIdx()];
        }
        // assign the clusters
        this.result.clusters = clusters;
    }
}
