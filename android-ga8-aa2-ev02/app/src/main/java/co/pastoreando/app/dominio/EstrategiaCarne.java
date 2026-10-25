package co.pastoreando.app.dominio;

/** Ganado de carne: sin recargo de manejo. */
public final class EstrategiaCarne implements EstrategiaCosto {

    @Override
    public String valorApi() {
        return "Carne";
    }

    @Override
    public double factorManejo() {
        return 1.00;
    }
}
