/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Activity } from '../activity';
/**
 * Remove any ProductInfo entities from the activity
 * @param activity
 */
export declare const clearProductInfoFromActivity: (activity: Activity) => void;
/**
 * Add a new ProductInfo entity to the activity and ensure only one exists
 * @param activity
 * @param id
 */
export declare const addProductInfoToActivity: (activity: Activity, id: string) => void;
