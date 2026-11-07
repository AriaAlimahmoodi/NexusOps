import { TokenExchangeJtiRepository } from '../database/repositories/token-exchange-jti.repository';
export declare class JtiStoreService {
    private readonly jtiRepository;
    constructor(jtiRepository: TokenExchangeJtiRepository);
    consume(jti: string, expiresAt: Date): Promise<boolean>;
}
