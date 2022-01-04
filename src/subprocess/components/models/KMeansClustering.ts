import { EMethodStatus, EMethodType, IKMeansModelParams, ISubsetRecord } from "../../../interfaces";

import qm from "qminer";
import ModelBasic from "./ModelBasic";

// get the promise version of setImmediate
import { promisify } from "util";
import { BadRequest } from "../../../utils/ErrorDefs";
const setImmediateP = promisify(setImmediate);

export default class KMeansClustering extends ModelBasic {
    private result: { [key: string]: any };
    private featureSpace: qm.FeatureSpace | null;
    private model: qm.analytics.KMeans | null;

    /**
     * Creates a new ClusteringKMeans instance.
     * @param base - The qminer base.
     * @param subset - The subset.
     * @param params - The method parameters.
     */
    constructor(base: qm.Base, subset: ISubsetRecord, params: IKMeansModelParams) {
        super(base, subset, params, EMethodType.CLUSTERING_KMEANS);
        this.featureSpace = null;
        this.model = null;
        this.result = {};
    }

    /** Initializes the model. */
    async init(): Promise<KMeansClustering> {
        try {
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
        } catch (error: any) {
            this._handleError(error);
            return this;
        }
    }

    /** Trains the model. */
    async train(): Promise<KMeansClustering> {
        try {
            // set the method status
            this.method.status = EMethodStatus.TRAINING;
            // get the feature matrix and train the model
            const matrix = this.featureSpace?.extractSparseMatrix(
                this.subset.hasElements
            ) as qm.la.SparseMatrix;
            // get the columns with non-zero norms
            const norms = matrix.colNorms();
            const nonzeros = new qm.la.IntVector();
            const zeros = new qm.la.IntVector();
            for (let i = 0; i < norms.length; i++) {
                norms[i] !== 0 ? nonzeros.push(i) : zeros.push(i);
            }
            const submatrix = matrix.getColSubmatrix(nonzeros);
            await this._trainModel(submatrix as qm.la.SparseMatrix);
            // get the cluster statistics
            this._clusterStatistics(submatrix, nonzeros);
            // assign the empty cluster
            if (zeros.length !== 0) {
                this._emptyCluster(zeros);
            }
            // set the method results
            this.method.result = this.result;
            this.method.status = EMethodStatus.FINISHED;
            return this;
        } catch (error: any) {
            this._handleError(error);
            return this;
        }
    }

    /** Get the method parameters. */
    getParams() {
        return this.params as IKMeansModelParams;
    }

    /////////////////////////////////////////////
    // HELPER FUNCTIONS
    /////////////////////////////////////////////

    /** Set the clustering features */
    _setFeatures() {
        // prepare placeholders
        let features: any[] = [];
        let distanceType: string;
        // get the model parameters
        const params = this.getParams();
        switch (params.method.clusteringType) {
            case "text":
                // clustering is performed on text fields
                distanceType = "Cos";
                features = [
                    {
                        type: "text",
                        field: params.fields,
                        ngrams: 1,
                        tokenizer: {
                            type: "simple",
                            stopwords: {
                                language: "en",
                                words: [""],
                                ...params.processing.stopwords,
                            },
                        },
                    },
                ];
                break;
            case "number":
                // the clustering is performed on number fields
                distanceType = "Euclid";
                features = params.fields.map((field) => ({
                    type: "numeric",
                    field,
                })) as { type: string; field: string }[];
                break;
            default:
                throw new Error(
                    `Invalid clustering type; clusteringType=${params.method.clusteringType}`
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
    _clusterStatistics(matrix: qm.la.SparseMatrix, nonzeros: qm.la.IntVector) {
        // get the model parameters
        const params = this.getParams();
        // prepare clusters statistics placeholder
        const clusters = Array(...Array(params.method?.k)).map(() => ({
            distances: {
                max: -1,
                min: -1,
                mean: -1,
                std: -1,
            },
            features: [] as { feature: string | number; weight: number }[],
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
            const tmpId = nonzeros[id] as number;
            const docId = (documents[tmpId] as qm.Record).$id;
            clusters[clusterId].docIds.push(docId);
            // save the cluster document IDs
            if (!clusterIds[clusterId]) {
                clusterIds[clusterId] = [];
            }
            clusterIds[clusterId].push(id);
        }
        // calculate the distances of the matrix
        for (const [clusterId, ids] of Object.entries(clusterIds)) {
            const docIds = new qm.la.IntVector(ids);
            const submatrix = matrix.getColSubmatrix(docIds);
            const centroid = this.model?.centroids?.getCol(parseInt(clusterId)) as qm.la.Vector;

            // get the cluster statistics
            let dists = new qm.la.Vector();
            if (params.method.clusteringType === "text") {
                submatrix.normalizeCols();
                centroid.normalize();
                // get the cosine distances between the documents and centroid
                dists = submatrix.multiplyT(centroid) as qm.la.Vector;
                dists = qm.la.ones(dists.length).minus(dists);
            } else if (params.method.clusteringType === "number") {
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
            // calculate the statistics
            const mean = qm.statistics.mean(dists) as number;
            const std = qm.statistics.std(dists) as number;
            const max = dists[dists.getMaxIdx()];
            const min = dists[dists.multiply(-1).getMaxIdx()];
            clusters[parseInt(clusterId)].distances = { mean, std, max, min };

            // get the top features of the centroid
            const sort = centroid.sortPerm(false);
            const limit = sort.perm.length < 100 ? sort.perm.length : 100;
            for (let i = 0; i < limit; i++) {
                // get the maximum weight
                const [weight, id] = [sort.vec[i], sort.perm[i]];
                const feature = this.featureSpace?.getFeature(id) as string;
                if (weight === 0) {
                    // break when we get to the end of the feature list
                    break;
                }
                clusters[parseInt(clusterId)].features.push({ feature, weight });
            }
        }
        // assign the clusters
        this.result.clusters = clusters;
    }

    /**
     * Assigns the empty cluster.
     * @param zeros - The IDs that are in the empty cluster.
     */
    _emptyCluster(zeros: qm.la.IntVector) {
        this.result.empty = {
            docIds: zeros.toArray(),
            subsetId: -1,
        };
    }

    /**
     * Handles the error.
     * @param error - The error object.
     */
    _handleError(error: Error) {
        // set the method status
        this.method.status = EMethodStatus.ERROR;
        throw new BadRequest(error.message);
    }
}
