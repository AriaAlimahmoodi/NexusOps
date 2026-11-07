/**
 * XML Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { XmlV1JsonToxmlNode } from './mode_json_toxml';
import type { XmlV1XmlToJsonNode } from './mode_xml_to_json';

export * from './mode_json_toxml';
export * from './mode_xml_to_json';

export type XmlV1Node =
  | XmlV1JsonToxmlNode
  | XmlV1XmlToJsonNode
  ;