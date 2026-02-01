import primer3

class PrimerEngine:
    """
    A utility class to handle all Primer3 interactions.
    """

    @staticmethod
    def generate_primers(sequence: str, min_tm=57.0, max_tm=63.0, prod_min=100, prod_max=300):
        """
        Generates primers for a given sequence.
        """
        # Dictionary 1: The Sequence Data
        seq_args = {
            'SEQUENCE_ID': 'hackathon_submission',
            'SEQUENCE_TEMPLATE': sequence
        }

        # Dictionary 2: The Design Parameters
        global_args = {
            'PRIMER_OPT_SIZE': 20,
            'PRIMER_PICK_INTERNAL_OLIGO': 1,      # Pick hybridization probe? 1=Yes
            'PRIMER_INTERNAL_MAX_SELF_END': 8,    # Probe constraints
            'PRIMER_MIN_SIZE': 18,
            'PRIMER_MAX_SIZE': 25,
            'PRIMER_OPT_TM': 60.0,
            'PRIMER_MIN_TM': min_tm,
            'PRIMER_MAX_TM': max_tm,
            'PRIMER_MIN_GC': 20.0,
            'PRIMER_MAX_GC': 80.0,
            'PRIMER_PRODUCT_SIZE_RANGE': [[prod_min, prod_max]],
        }

        # The Core Function Call
        return primer3.design_primers(seq_args, global_args)

    @staticmethod
    def analyze_sequence(sequence: str):
        """
        Returns physical properties of a single DNA string.
        Useful for validation agents.
        """
        tm = primer3.calc_tm(sequence)
        hairpin = primer3.calc_hairpin(sequence)
        homodimer = primer3.calc_homodimer(sequence)

        return {
            "sequence": sequence,
            "tm": round(tm, 2),
            "hairpin_tm": round(hairpin.tm, 2),
            "homodimer_tm": round(homodimer.tm, 2)
        }

    @staticmethod
    def check_compatibility(forward_seq: str, reverse_seq: str):
        """
        Checks if two primers will interfere with each other.
        """
        heterodimer = primer3.calc_heterodimer(forward_seq, reverse_seq)
        return {
            "has_dimer_risk": heterodimer.tm > 40.0, # Threshold example
            "dimer_tm": round(heterodimer.tm, 2)
        }