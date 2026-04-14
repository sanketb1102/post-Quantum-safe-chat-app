/* pqc_wrapper.c */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <oqs/oqs.h>
#include <emscripten.h>

/* * We use Kyber512 as per the assignment/friend's project.
 * It is NIST Level 1 security (equivalent to AES-128), efficient, and standard.
 */

// 1. Generate Keypair
// Takes pointers to memory where Public Key (pk) and Secret Key (sk) will be stored.
EMSCRIPTEN_KEEPALIVE
int generate_keypair(uint8_t *pk, uint8_t *sk) {
    OQS_KEM *kem = OQS_KEM_new(OQS_KEM_alg_kyber_512);
    if (kem == NULL) return -1;

    OQS_KEM_keypair(kem, pk, sk);
    
    OQS_KEM_free(kem);
    return 0; // Success
}

// 2. Encapsulate (For Sender)
// Generates a Shared Secret (ss) and encrypts it into Ciphertext (ct) using Receiver's Public Key (pk).
EMSCRIPTEN_KEEPALIVE
int encapsulate(uint8_t *ct, uint8_t *ss, uint8_t *pk) {
    OQS_KEM *kem = OQS_KEM_new(OQS_KEM_alg_kyber_512);
    if (kem == NULL) return -1;

    OQS_KEM_encaps(kem, ct, ss, pk);

    OQS_KEM_free(kem);
    return 0; // Success
}

// 3. Decapsulate (For Receiver)
// Uses Secret Key (sk) to decrypt Ciphertext (ct) and recover the Shared Secret (ss).
EMSCRIPTEN_KEEPALIVE
int decapsulate(uint8_t *ss, uint8_t *ct, uint8_t *sk) {
    OQS_KEM *kem = OQS_KEM_new(OQS_KEM_alg_kyber_512);
    if (kem == NULL) return -1;

    OQS_KEM_decaps(kem, ss, ct, sk);

    OQS_KEM_free(kem);
    return 0; // Success
}

// Helper: Returns the sizes needed for Kyber512 so JS knows how much memory to allocate
EMSCRIPTEN_KEEPALIVE
int get_public_key_bytes() { return OQS_KEM_kyber_512_length_public_key; }

EMSCRIPTEN_KEEPALIVE
int get_secret_key_bytes() { return OQS_KEM_kyber_512_length_secret_key; }

EMSCRIPTEN_KEEPALIVE
int get_ciphertext_bytes() { return OQS_KEM_kyber_512_length_ciphertext; }

EMSCRIPTEN_KEEPALIVE
int get_shared_secret_bytes() { return OQS_KEM_kyber_512_length_shared_secret; }