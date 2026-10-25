package co.pastoreando.app.dominio;

/** Ganado de doble proposito: recargo intermedio del 5 %. */
public final class EstrategiaDobleProposito implements EstrategiaCosto {

    @Override
    public String valorApi() {
        // El servidor recibe el proposito sin tilde.
        return "Doble Proposito";
    }

    @Override
    public double factorManejo() {
        return 1.05;
    }
}
